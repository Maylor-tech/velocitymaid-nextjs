export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Tip Prompt (Cron)
 * GET /api/cron/tip-prompt
 *
 * Sends a one-time WhatsApp inviting a tip 15 min after a 4–5⭐ rating.
 * Duplicates prevented via audit log.
 *
 * Auth: Bearer CRON_SECRET
 * Manual test: GET /api/cron/tip-prompt with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const MS_PER_MIN = 60 * 1000;
const TARGET_MIN = 15;
const WINDOW_HALF_MIN = 3; // 12–18 min

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

    const ratings = await prisma.cleanerRating.findMany({
      where: {
        rating: { gte: 4 },
        createdAt: { gte: windowStart, lte: windowEnd },
      },
      select: {
        jobId: true,
        cleanerId: true,
        Job: {
          select: {
            id: true,
            Customer: { select: { phone: true } },
            User: { select: { name: true } },
          },
        },
      },
    });

    const jobIds = [...new Set(ratings.map((r) => r.jobId))];
    if (jobIds.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: 'TIP_PROMPT_SENT',
        entityType: 'Job',
        entityId: { in: jobIds },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com';

    let sent = 0;
    for (const r of ratings) {
      if (sentSet.has(r.jobId)) continue;
      const phone = r.Job?.Customer?.phone?.trim();
      if (!phone) continue;

      const cleanerName = r.Job?.User?.name || 'your cleaner';
      const tipLink = `${baseUrl.replace(/\/$/, '')}/customer/tip?jobId=${r.jobId}`;

      const message = [
        '💛 Glad you loved the clean!',
        '',
        `If you'd like to leave a tip for ${cleanerName}, you can do so here:`,
        tipLink,
        '',
        'Thank you for supporting great service.',
        '— VelocityMaid',
      ].join('\n');

      sendWhatsAppMessage({ to: phone, message }).catch(() => {});

      await logAuditEntry({
        action: 'TIP_PROMPT_SENT',
        entityType: 'Job',
        entityId: r.jobId,
        description: 'Tip prompt WhatsApp sent after positive rating',
        changes: { sentAt: new Date().toISOString() },
      });
      sentSet.add(r.jobId);
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/tip-prompt]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Tip prompt cron failed' },
      { status: 500 }
    );
  }
}
