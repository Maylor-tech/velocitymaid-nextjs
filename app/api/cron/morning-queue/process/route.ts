export const dynamic = 'force-dynamic';

/**
 * Morning Queue Processing Cron Job
 * GET /api/cron/morning-queue/process
 * 
 * Runs at 8:30 AM EST daily
 * Processes leads waiting for morning follow-up
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { getMorningFollowUpMessage } from '@/config/afterHoursMessages';
import { isAfterHours } from '@/lib/time/isAfterHours';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if it's actually morning (after 8 AM EST)
    if (isAfterHours()) {
      return NextResponse.json({
        success: false,
        message: 'Still after-hours. Wait until 8:30 AM EST.',
        isAfterHours: true,
      });
    }

    // Get all leads waiting for morning
    const waitingLeads = await prisma.lead.findMany({
      where: {
        waitForMorning: true,
        status: { in: ['ACTIVE', 'NEW'] },
      },
      orderBy: {
        createdAt: 'asc', // Process oldest first
      },
      take: 100, // Process up to 100 at a time
    });

    if (waitingLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leads waiting for morning follow-up',
        processed: 0,
      });
    }

    const results = {
      total: waitingLeads.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each lead
    for (const lead of waitingLeads) {
      try {
        // Generate morning follow-up message
        const message = getMorningFollowUpMessage(lead.name);

        // Send WhatsApp message
        const result = await sendWhatsAppMessage(lead.phone, message);

        if (result.success) {
          // Update lead
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              waitForMorning: false,
              status: 'ACTIVE', // Ensure it's active
              afterHoursMessage: null, // Clear after-hours message
            },
          });

          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Lead ${lead.id}: ${result.error || 'Unknown error'}`);
        }

        // Rate limiting: Wait 1 second between messages
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Lead ${lead.id}: ${error.message || 'Unknown error'}`);
        console.error(`Error processing lead ${lead.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.sent} of ${results.total} leads`,
      results,
    });
  } catch (error: any) {
    console.error('Morning queue processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process morning queue' },
      { status: 500 }
    );
  }
}

