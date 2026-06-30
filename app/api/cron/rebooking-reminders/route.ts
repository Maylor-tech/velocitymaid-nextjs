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
import { sendRebookingReminderEmail } from '@/lib/email/cronAutomationEmails';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'REBOOKING_REMINDER_SENT';
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
    const authError = verifyCronAuth(request);
    if (authError) return authError;

    const { start: checkoutStart, end: checkoutEnd } = dayWindow(7);

    const jobs = await prisma.job.findMany({
      where: {
        preferredDate: { gte: checkoutStart, lt: checkoutEnd },
        customerId: { not: null },
        archivedAt: null,
        status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
        Customer: { email: { not: null } },
      },
      select: {
        id: true,
        customerId: true,
        preferredDate: true,
        address: true,
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
      return NextResponse.json({ success: true, processed: 0, sent: 0, failed: 0 });
    }

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: ACTION,
        entityType: 'Job',
        entityId: { in: jobs.map((j) => j.id) },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const job of jobs) {
      if (sentSet.has(job.id) || !job.customerId || !job.preferredDate) {
        skipped++;
        continue;
      }

      const checkout = new Date(job.preferredDate);
      const followUpStart = new Date(checkout);
      followUpStart.setDate(followUpStart.getDate() + 1);
      followUpStart.setHours(0, 0, 0, 0);
      const followUpEnd = new Date(checkout);
      followUpEnd.setDate(followUpEnd.getDate() + 15);
      followUpEnd.setHours(0, 0, 0, 0);

      const turnoverFollowUp = await prisma.job.count({
        where: {
          customerId: job.customerId,
          id: { not: job.id },
          archivedAt: null,
          status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
          preferredDate: { gte: followUpStart, lt: followUpEnd },
          OR: [
            { serviceType: { contains: 'Turnover', mode: 'insensitive' } },
            { serviceType: { contains: 'turnover', mode: 'insensitive' } },
          ],
        },
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

      const result = await sendRebookingReminderEmail({
        toEmail: email,
        hostFirstName: job.Customer?.firstName || 'there',
        propertyAddress,
        checkoutDate: checkout,
      });

      if (result.sent) {
        await logAuditEntry({
          action: ACTION,
          entityType: 'Job',
          entityId: job.id,
          description: 'Rebooking reminder email sent to host',
          changes: { sentAt: new Date().toISOString() },
        });
        sent++;
      } else {
        console.error(
          `[rebooking-reminders] Failed for job ${job.id}:`,
          result.error || result.skippedReason
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: jobs.length,
      sent,
      failed,
      skipped,
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
