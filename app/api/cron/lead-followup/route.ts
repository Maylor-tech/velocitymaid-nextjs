export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Lead Follow-up (Cron)
 * GET /api/cron/lead-followup
 *
 * Sends one follow-up email to leads (NEW / INTAKE_RECEIVED) older than 3 days.
 * Schedule: daily 10:00 AM UTC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { sendLeadFollowUpEmail } from '@/lib/email/cronAutomationEmails';

const MAX_PER_RUN = 100;

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 3);

    const leads = await prisma.customer.findMany({
      where: {
        leadStatus: { in: [LeadStatus.NEW, LeadStatus.INTAKE_RECEIVED] },
        createdAt: { lt: cutoff },
        followUpSentAt: null,
        email: { not: '' },
        isBlocked: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        defaultAddress: true,
        addressLine1: true,
        city: true,
        state: true,
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_PER_RUN,
    });

    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      const propertyAddress =
        lead.defaultAddress ||
        [lead.addressLine1, lead.city, lead.state].filter(Boolean).join(', ') ||
        'your property';

      const result = await sendLeadFollowUpEmail({
        toEmail: lead.email,
        firstName: lead.firstName,
        propertyAddress,
      });

      if (result.sent) {
        await prisma.customer.update({
          where: { id: lead.id },
          data: { followUpSentAt: new Date(), updatedAt: new Date() },
        });
        sent++;
      } else {
        console.error(
          `[lead-followup] Failed for ${lead.email}:`,
          result.error || result.skippedReason
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: leads.length,
      sent,
      failed,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Lead follow-up cron failed';
    console.error('[lead-followup]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
