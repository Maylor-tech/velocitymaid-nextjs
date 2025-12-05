export const dynamic = 'force-dynamic';

/**
 * Process Nurture Sequence Messages (Cron Job)
 * GET /api/cron/nurture/process
 * 
 * Runs periodically to send scheduled nurture messages
 * Checks for messages that should be sent now
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { getNurtureMessage, shouldStopSequence } from '@/utils/nurtureMessages';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    let processedCount = 0;

    // Get all active nurture sequences
    const sequences = await prisma.nurtureSequence.findMany({
      where: {
        isActive: true,
      },
      include: {
        customer: {
          include: {
            branch: true,
          },
        },
      },
    });

    for (const sequence of sequences) {
      // Check if sequence should be stopped
      if (shouldStopSequence(false, sequence.customer.leadStatus)) {
        await prisma.nurtureSequence.update({
          where: { id: sequence.id },
          data: {
            isActive: false,
            pausedAt: new Date(),
          },
        });
        continue;
      }

      // Calculate which day should be sent
      const startedAt = sequence.startedAt;
      const hoursSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
      
      const daySchedule = [
        { day: 0, hours: 0 },
        { day: 1, hours: 24 },
        { day: 2, hours: 48 },
        { day: 3, hours: 72 },
        { day: 4, hours: 96 },
        { day: 5, hours: 120 },
        { day: 6, hours: 144 },
        { day: 7, hours: 168 },
      ];

      // Find which day should be sent now (within 1 hour window)
      const targetDay = daySchedule.find(
        s => hoursSinceStart >= s.hours && hoursSinceStart < s.hours + 1
      );

      if (!targetDay) continue;

      // Check if this day's message was already sent
      const existingHistory = await prisma.nurtureHistory.findFirst({
        where: {
          nurtureSequenceId: sequence.id,
          day: targetDay.day,
          status: 'SENT',
        },
      });

      if (existingHistory) continue;

      // Generate message
      const message = getNurtureMessage(
        targetDay.day,
        sequence.customer.firstName,
        sequence.referralCode || undefined,
        sequence.customer.branch?.slug || 'new-jersey'
      );

      // Create history record
      const history = await prisma.nurtureHistory.create({
        data: {
          customerId: sequence.customerId,
          nurtureSequenceId: sequence.id,
          day: targetDay.day,
          message,
          channel: sequence.customer.whatsappOptIn ? 'WHATSAPP' : 'SMS',
          status: 'PENDING',
        },
      });

      // Send message
      let messageId: string | undefined;
      let error: string | undefined;

      if (sequence.customer.whatsappOptIn && sequence.customer.phone) {
        const result = await sendWhatsAppMessage(sequence.customer.phone, message);
        if (result.success) {
          messageId = result.messageId;
        } else {
          error = result.error;
        }
      } else if (sequence.customer.phone) {
        // SMS sending would go here
        console.log('SMS message (would send):', {
          to: sequence.customer.phone,
          message,
        });
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

      // Update sequence current day
      await prisma.nurtureSequence.update({
        where: { id: sequence.id },
        data: {
          currentDay: targetDay.day,
        },
      });

      // If day 7, mark sequence as completed
      if (targetDay.day === 7) {
        await prisma.nurtureSequence.update({
          where: { id: sequence.id },
          data: {
            isActive: false,
            completedAt: new Date(),
          },
        });
      }

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} nurture messages`,
      processed: processedCount,
      sequencesChecked: sequences.length,
    });
  } catch (error: any) {
    console.error('Process nurture messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process nurture messages' },
      { status: 500 }
    );
  }
}

