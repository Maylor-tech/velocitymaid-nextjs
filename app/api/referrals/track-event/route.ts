export const dynamic = 'force-dynamic';

/**
 * Track Referral Event API
 * POST /api/referrals/track-event
 * 
 * Tracks a referral event (when someone uses a referral code)
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, referredCustomerId, branchId, jobId } = body;

    if (!referralCode || !referredCustomerId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Referral code, customer ID, and branch ID are required' },
        { status: 400 }
      );
    }

    // Find referral link by code
    const referralLink = await prisma.referralLink.findUnique({
      where: { code: referralCode },
      include: {
        customer: true,
      },
    });

    if (!referralLink || !referralLink.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive referral code' },
        { status: 404 }
      );
    }

    // Check if referrer and referred are the same person
    if (referralLink.customerId === referredCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Check if referral event already exists for this customer
    const existingEvent = await prisma.referralEvent.findFirst({
      where: {
        referrerId: referralLink.customerId,
        referredCustomerId,
        branchId,
        status: {
          in: ['PENDING', 'COMPLETED'],
        },
      },
    });

    if (existingEvent) {
      return NextResponse.json({
        success: true,
        event: existingEvent,
        message: 'Referral event already exists',
      });
    }

    // Create referral event
    const referralEvent = await prisma.referralEvent.create({
      data: {
        referrerId: referralLink.customerId,
        referredCustomerId,
        branchId,
        referralLinkId: referralLink.id,
        jobId: jobId || null,
        status: 'PENDING',
        referredDiscountApplied: false,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: referralEvent.id,
        referrerId: referralEvent.referrerId,
        referredCustomerId: referralEvent.referredCustomerId,
        status: referralEvent.status,
      },
    });
  } catch (error: any) {
    console.error('Track referral event error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to track referral event' },
      { status: 500 }
    );
  }
}

