export const dynamic = 'force-dynamic';

/**
 * Day 0 Nurture Message
 * POST /api/automations/nurture/day0
 * 
 * Sends Day 0 welcome message immediately when lead is created
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { getNurtureMessage } from '@/utils/nurtureMessages';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, branchId } = body;

    if (!customerId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and Branch ID are required' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        referralLinks: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!customer || !customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer or phone number not found' },
        { status: 404 }
      );
    }

    // Check if sequence should be stopped
    if (customer.leadStatus === 'BOOKED' || customer.leadStatus === 'CLOSED') {
      return NextResponse.json({
        success: true,
        message: 'Sequence stopped - customer already booked',
      });
    }

    // Get or create referral code
    let referralCode = customer.referralLinks[0]?.code;
    if (!referralCode) {
      const branchPrefix = customer.branch?.slug === 'new-jersey' ? 'NJ' : 'VM';
      referralCode = `${branchPrefix}-${customerId.substring(0, 8).toUpperCase()}`;
      
      await prisma.referralLink.create({
        data: {
          customerId,
          branchId,
          code: referralCode,
          isActive: true,
        },
      });
    }

    // Create or get nurture sequence
    let sequence = await prisma.nurtureSequence.findUnique({
      where: { customerId },
    });

    if (!sequence) {
      sequence = await prisma.nurtureSequence.create({
        data: {
          customerId,
          branchId,
          currentDay: 0,
          referralCode,
          isActive: true,
        },
      });
    }

    // Generate message
    const message = getNurtureMessage(
      0,
      customer.firstName,
      referralCode,
      customer.branch?.slug || 'new-jersey'
    );

    // Create history record
    const history = await prisma.nurtureHistory.create({
      data: {
        customerId,
        nurtureSequenceId: sequence.id,
        day: 0,
        message,
        channel: customer.whatsappOptIn ? 'WHATSAPP' : 'SMS',
        status: 'PENDING',
      },
    });

    // Send message
    let messageId: string | undefined;
    let error: string | undefined;

    if (customer.whatsappOptIn) {
      const result = await sendWhatsAppMessage(customer.phone, message);
      if (result.success) {
        messageId = result.messageId;
      } else {
        error = result.error;
      }
    } else {
      // SMS sending would go here (integrate with SMS service)
      // For now, log it
      console.log('SMS message (would send):', { to: customer.phone, message });
    }

    // Update history
    await prisma.nurtureHistory.update({
      where: { id: history.id },
      data: {
        status: messageId ? 'SENT' : 'FAILED',
        messageId,
        sentAt: messageId ? new Date() : null,
        errorMessage: error || null,
      },
    });

    // Update customer status
    if (customer.leadStatus === 'NEW') {
      await prisma.customer.update({
        where: { id: customerId },
        data: { leadStatus: 'ACTIVE' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Day 0 message sent',
      historyId: history.id,
      messageId,
    });
  } catch (error: any) {
    console.error('Day 0 nurture error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send Day 0 message' },
      { status: 500 }
    );
  }
}

