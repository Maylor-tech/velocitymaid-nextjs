export const dynamic = 'force-dynamic';

/**
 * Send Nurture Message for Specific Day
 * POST /api/automations/nurture/send-day
 * 
 * Generic endpoint to send any day's nurture message
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { getNurtureMessage, shouldStopSequence } from '@/utils/nurtureMessages';

export async function POST(request: NextRequest) {
  let day: number | undefined;
  try {
    const body = await request.json();
    const { customerId, day: dayValue } = body;
    day = dayValue;

    if (!customerId || dayValue === undefined) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and day are required' },
        { status: 400 }
      );
    }

    if (dayValue < 0 || dayValue > 7) {
      return NextResponse.json(
        { success: false, error: 'Day must be between 0 and 7' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        nurtureSequence: true,
      },
    });

    if (!customer || !customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer or phone number not found' },
        { status: 404 }
      );
    }

    // Check if sequence should be stopped
    if (shouldStopSequence(false, customer.leadStatus)) {
      if (customer.nurtureSequence) {
        await prisma.nurtureSequence.update({
          where: { id: customer.nurtureSequence.id },
          data: {
            isActive: false,
            pausedAt: new Date(),
          },
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Sequence stopped - customer replied or booked',
      });
    }

    // Get or create nurture sequence
    let sequence = customer.nurtureSequence;
    if (!sequence) {
      sequence = await prisma.nurtureSequence.create({
        data: {
          customerId,
          branchId: customer.branchId!,
          currentDay: dayValue,
          referralCode: null, // Will be generated if needed
          isActive: true,
        },
      });
    }

    // Get referral code
    const referralLink = await prisma.referralLink.findFirst({
      where: {
        customerId,
        isActive: true,
      },
    });

    const referralCode = referralLink?.code || sequence.referralCode;

    // Check if message already sent
    const existingHistory = await prisma.nurtureHistory.findFirst({
      where: {
        nurtureSequenceId: sequence.id,
        day: dayValue,
        status: 'SENT',
      },
    });

    if (existingHistory) {
      return NextResponse.json({
        success: true,
        message: `Day ${day} message already sent`,
        historyId: existingHistory.id,
      });
    }

    // Generate message
    const message = getNurtureMessage(
      dayValue,
      customer.firstName,
      referralCode || undefined,
      customer.branch?.slug || 'new-jersey'
    );

    // Create history record
    const history = await prisma.nurtureHistory.create({
      data: {
        customerId,
        nurtureSequenceId: sequence.id,
        day: dayValue,
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

    // Update sequence
    await prisma.nurtureSequence.update({
      where: { id: sequence.id },
      data: {
        currentDay: dayValue,
        ...(dayValue === 7 && { isActive: false, completedAt: new Date() }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Day ${dayValue} message sent`,
      historyId: history.id,
      messageId,
    });
  } catch (error: any) {
    console.error(`Day ${day ?? 'unknown'} nurture error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || `Failed to send Day ${day ?? 'unknown'} message` },
      { status: 500 }
    );
  }
}

