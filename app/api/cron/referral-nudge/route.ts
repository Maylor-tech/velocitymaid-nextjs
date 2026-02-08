export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Referral Nudge (Cron)
 * GET /api/cron/referral-nudge
 *
 * Sends a one-time WhatsApp 24h after a 5⭐ review, with the customer's referral link.
 * Duplicates prevented via audit log.
 *
 * Auth: Bearer CRON_SECRET
 * Manual test: GET /api/cron/referral-nudge with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const MS_PER_MIN = 60 * 1000;
const TARGET_HOURS = 24;
const WINDOW_HALF_HOURS = 1; // 23–25h

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const windowStart = new Date(
      now.getTime() - (TARGET_HOURS + WINDOW_HALF_HOURS) * 60 * MS_PER_MIN
    );
    const windowEnd = new Date(
      now.getTime() - (TARGET_HOURS - WINDOW_HALF_HOURS) * 60 * MS_PER_MIN
    );

    const ratings = await prisma.cleanerRating.findMany({
      where: {
        rating: 5,
        createdAt: { gte: windowStart, lte: windowEnd },
      },
      select: {
        jobId: true,
        Job: {
          select: {
            id: true,
            branchId: true,
            customerId: true,
            Customer: { select: { phone: true } },
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
        action: 'REFERRAL_NUDGE_SENT',
        entityType: 'Job',
        entityId: { in: jobIds },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(
      /\/$/,
      ''
    );

    let sent = 0;
    for (const r of ratings) {
      if (sentSet.has(r.jobId)) continue;
      const phone = r.Job?.Customer?.phone?.trim();
      const customerId = r.Job?.customerId;
      const branchId = r.Job?.branchId;
      if (!phone) continue;

      let referralLink = '';
      if (customerId && branchId) {
        const link = await prisma.referralLink.findFirst({
          where: {
            customerId,
            branchId,
            isActive: true,
          },
          select: { code: true },
        });
        if (link) {
          referralLink = `${baseUrl}/ref/${link.code}`;
        }
      }
      if (!referralLink) {
        referralLink = `${baseUrl}/customer/referrals`;
      }

      const message = [
        '🌟 Thanks for the 5-star review!',
        '',
        "Share the love—refer a friend and you'll both get a discount on your next clean:",
        referralLink,
        '',
        '— VelocityMaid',
      ].join('\n');

      sendWhatsAppMessage({ to: phone, message }).catch(() => {});

      await logAuditEntry({
        action: 'REFERRAL_NUDGE_SENT',
        entityType: 'Job',
        entityId: r.jobId,
        description: 'Referral nudge WhatsApp sent after 5-star rating',
        changes: { sentAt: new Date().toISOString() },
      });
      sentSet.add(r.jobId);
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/referral-nudge]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Referral nudge cron failed' },
      { status: 500 }
    );
  }
}
