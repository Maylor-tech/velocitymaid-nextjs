export const dynamic = 'force-dynamic';

/**
 * Process Referral After Booking Completion
 * POST /api/webhooks/referrals/process
 * 
 * Called after a booking is completed to:
 * 1. Track referral event
 * 2. Give $20 credit to referrer
 * 3. Send notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, customerId, branchId, referralCode } = body;

    if (!jobId || !customerId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Job ID, Customer ID, and Branch ID are required' },
        { status: 400 }
      );
    }

    // If no referral code, nothing to process
    if (!referralCode) {
      return NextResponse.json({
        success: true,
        message: 'No referral code to process',
      });
    }

    // Find referral link
    const referralLink = await prisma.referralLink.findUnique({
      where: { code: referralCode },
      include: {
        customer: true,
      },
    });

    if (!referralLink || !referralLink.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Invalid referral code, skipping',
      });
    }

    // Check if customer is referring themselves
    if (referralLink.customerId === customerId) {
      return NextResponse.json({
        success: true,
        message: 'Cannot refer yourself, skipping',
      });
    }

    // Find or create referral event
    let referralEvent = await prisma.referralEvent.findFirst({
      where: {
        referrerId: referralLink.customerId,
        referredCustomerId: customerId,
        branchId,
        status: 'PENDING',
      },
    });

    if (!referralEvent) {
      // Create new referral event
      referralEvent = await prisma.referralEvent.create({
        data: {
          referrerId: referralLink.customerId,
          referredCustomerId: customerId,
          branchId,
          referralLinkId: referralLink.id,
          jobId,
          status: 'PENDING',
          referredDiscountApplied: true, // $20 discount was applied
        },
      });
    } else {
      // Update existing event with job ID
      referralEvent = await prisma.referralEvent.update({
        where: { id: referralEvent.id },
        data: {
          jobId,
          referredDiscountApplied: true,
        },
      });
    }

    // Get job to check if it's completed
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    // If job is completed, give credit to referrer
    if (job && job.status === 'completed') {
      // Check if credit already given
      const existingCredit = await prisma.referralCredit.findFirst({
        where: {
          customerId: referralLink.customerId,
          appliedToJobId: jobId,
          status: 'APPLIED',
        },
      });

      if (!existingCredit) {
        // Give $20 credit to referrer
        const credit = await prisma.referralCredit.create({
          data: {
            customerId: referralLink.customerId,
            referralLinkId: referralLink.id,
            amount: 20,
            status: 'PENDING', // Will be applied when they book
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          },
        });

        // Update referral event
        await prisma.referralEvent.update({
          where: { id: referralEvent.id },
          data: {
            status: 'COMPLETED',
            referrerCreditId: credit.id,
          },
        });

        // Send WhatsApp notification to referrer
        try {
          await fetch('/api/automations/referrals/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: referralLink.customerId,
              messageType: 'credit_earned',
            }),
          });
        } catch (error) {
          console.error('Failed to send WhatsApp notification:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      referralEvent: {
        id: referralEvent.id,
        status: referralEvent.status,
      },
    });
  } catch (error: any) {
    console.error('Process referral error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process referral' },
      { status: 500 }
    );
  }
}

