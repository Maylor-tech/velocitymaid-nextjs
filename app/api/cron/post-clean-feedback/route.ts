export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Post-Clean Feedback Request (Cron)
 * GET /api/cron/post-clean-feedback
 *
 * Sends a one-time WhatsApp asking for 1–5 rating ~30 min after job completion.
 * Duplicates prevented via audit log.
 *
 * Auth: Bearer CRON_SECRET
 * Manual test: GET /api/cron/post-clean-feedback with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const MS_PER_MIN = 60 * 1000;
const TARGET_MIN = 30;
const WINDOW_HALF_MIN = 2; // 28–32 min

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - (TARGET_MIN + WINDOW_HALF_MIN) * MS_PER_MIN);
    const windowEnd = new Date(now.getTime() - (TARGET_MIN - WINDOW_HALF_MIN) * MS_PER_MIN);

    const jobs = await prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: windowStart, lte: windowEnd },
        Customer: { phone: { not: null } },
      },
      select: {
        id: true,
        completedAt: true,
        assignedCleanerId: true,
        customerId: true,
        Customer: { select: { phone: true } },
      },
    });

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: 'POST_CLEAN_FEEDBACK_REQUESTED',
        entityType: 'Job',
        entityId: { in: jobs.map((j) => j.id) },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    const hasRating = await prisma.cleanerRating.findMany({
      where: { jobId: { in: jobs.map((j) => j.id) } },
      select: { jobId: true },
    });
    const ratedSet = new Set(hasRating.map((r) => r.jobId));

    let sent = 0;
    for (const job of jobs) {
      if (sentSet.has(job.id) || ratedSet.has(job.id)) continue;
      const phone = job.Customer?.phone?.trim();
      if (!phone) continue;

      const message = [
        '✨ Your cleaning is complete!',
        '',
        'How did we do today?',
        '⭐️⭐️⭐️⭐️⭐️',
        '',
        'Reply with a number (1–5) or share a quick note.',
        '— VelocityMaid',
      ].join('\n');

      sendWhatsAppMessage({ to: phone, message }).catch(() => {});

      await logAuditEntry({
        action: 'POST_CLEAN_FEEDBACK_REQUESTED',
        entityType: 'Job',
        entityId: job.id,
        description: 'Post-clean feedback request sent to customer',
        changes: { sentAt: new Date().toISOString() },
      });
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/post-clean-feedback]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Post-clean feedback cron failed' },
      { status: 500 }
    );
  }
}
