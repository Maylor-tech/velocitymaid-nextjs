export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron: one private-feedback reminder per ServiceFeedback.
 * GET /api/cron/send-feedback-reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  FEEDBACK_AUDIT,
  claimFeedbackReminders,
  feedbackPublicUrl,
} from '@/lib/feedback/serviceFeedback';
import { sendServiceFeedbackRequestEmail } from '@/lib/feedback/sendServiceFeedbackEmail';
import { logAuditEntry } from '@/lib/audit';

const MAX_PER_RUN = 100;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claimed = await claimFeedbackReminders(MAX_PER_RUN);
    let sent = 0;
    let failed = 0;

    for (const row of claimed) {
      const customer = await prisma.customer.findUnique({
        where: { id: row.customerId },
        select: { email: true, firstName: true, lastName: true },
      });
      const job = await prisma.job.findUnique({
        where: { id: row.jobId },
        select: {
          address: true,
          Property: { select: { name: true, address: true } },
        },
      });

      if (!customer?.email) {
        failed++;
        continue;
      }

      const emailResult = await sendServiceFeedbackRequestEmail({
        toEmail: customer.email,
        clientName:
          `${customer.firstName} ${customer.lastName}`.trim() || 'there',
        propertyLabel:
          job?.Property?.name || job?.Property?.address || job?.address,
        publicToken: row.publicToken,
        isReminder: true,
      });

      if (emailResult.sent) {
        sent++;
        await logAuditEntry({
          actorRole: 'SYSTEM',
          action: FEEDBACK_AUDIT.REMINDER_SENT,
          entityType: 'ServiceFeedback',
          entityId: row.id,
          description: 'Private feedback reminder sent',
          changes: { url: feedbackPublicUrl(row.publicToken) },
        });
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      claimed: claimed.length,
      sent,
      failed,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to send feedback reminders';
    console.error('[send-feedback-reminders]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
