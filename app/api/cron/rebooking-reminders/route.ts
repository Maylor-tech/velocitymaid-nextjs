export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Rebooking Reminders (Cron)
 * GET /api/cron/rebooking-reminders
 *
 * Emails hosts when checkout is in 7 days and no turnover is scheduled
 * in the following 14 days. Schedule: daily 8:00 AM UTC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { logAuditEntry } from '@/lib/audit';
import {
  evaluateRebookingReminder,
  REBOOKING_REMINDER_ACTION,
  rebookingCandidateWhere,
  upcomingTurnoverWhere,
} from '@/lib/cron/rebookingReminders';
import {
  isRebookingReminderSendingEnabled,
  rebookingRemindersDisabledResponse,
} from '@/lib/cron/rebookingReminderGuard';
import {
  backfillSentRebookingReminders,
  deliverClaimedRebookingReminder,
  parkExpiredRebookingClaims,
} from '@/lib/cron/rebookingReminderClaim';

const MAX_PER_RUN = 100;

function dayWindow(daysFromToday: number): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysFromToday);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    // Stay ahead of auth and every database or provider call. A disabled
    // deployment can be verified without the cron secret and cannot send.
    if (!isRebookingReminderSendingEnabled()) {
      return NextResponse.json(rebookingRemindersDisabledResponse());
    }

    const authError = verifyCronAuth(request);
    if (authError) return authError;

    await parkExpiredRebookingClaims();
    await backfillSentRebookingReminders();

    const { start: checkoutStart, end: checkoutEnd } = dayWindow(7);

    const jobs = await prisma.job.findMany({
      where: rebookingCandidateWhere(checkoutStart, checkoutEnd),
      select: {
        id: true,
        customerId: true,
        preferredDate: true,
        address: true,
        status: true,
        Customer: {
          select: {
            email: true,
            firstName: true,
            defaultAddress: true,
            addressLine1: true,
          },
        },
      },
      take: MAX_PER_RUN,
    });

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        unknown: 0,
      });
    }

    const deliveries = await prisma.rebookingReminderDelivery.findMany({
      where: { jobId: { in: jobs.map((job) => job.id) } },
      select: { jobId: true, status: true },
    });
    const settled = new Set(
      deliveries
        .filter((row) => row.status === 'ACCEPTED' || row.status === 'UNKNOWN')
        .map((row) => row.jobId)
    );

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let unknown = 0;

    for (const job of jobs) {
      const precheck = evaluateRebookingReminder({
        job,
        alreadyReminded: settled.has(job.id),
        upcomingTurnoverScheduled: false,
      });
      if (!precheck.send) {
        skipped++;
        continue;
      }

      const checkout = new Date(job.preferredDate!);
      const followUpStart = new Date(checkout);
      followUpStart.setDate(followUpStart.getDate() + 1);
      followUpStart.setHours(0, 0, 0, 0);
      const followUpEnd = new Date(checkout);
      followUpEnd.setDate(followUpEnd.getDate() + 15);
      followUpEnd.setHours(0, 0, 0, 0);

      const turnoverFollowUp = await prisma.job.count({
        where: upcomingTurnoverWhere(
          job.customerId!,
          job.id,
          followUpStart,
          followUpEnd
        ),
      });

      if (turnoverFollowUp > 0) {
        skipped++;
        continue;
      }

      const email = job.Customer?.email;
      if (!email) {
        skipped++;
        continue;
      }

      const propertyAddress =
        job.address ||
        job.Customer?.defaultAddress ||
        job.Customer?.addressLine1 ||
        'your property';

      const outcome = await deliverClaimedRebookingReminder({
        toEmail: email,
        hostFirstName: job.Customer?.firstName || 'there',
        propertyAddress,
        checkoutDate: checkout,
        jobId: job.id,
      });

      if (outcome === 'sent') {
        await logAuditEntry({
          action: REBOOKING_REMINDER_ACTION,
          entityType: 'Job',
          entityId: job.id,
          description: 'Rebooking reminder email sent to host',
          changes: { sentAt: new Date().toISOString() },
        });
        sent++;
      } else if (outcome === 'failed') {
        failed++;
      } else if (outcome === 'unknown' || outcome === 'accepted_unrecorded') {
        unknown++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: jobs.length,
      sent,
      failed,
      skipped,
      unknown,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Rebooking reminder cron failed';
    console.error('[rebooking-reminders]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
