export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Referral Nudge (Cron)
 * GET /api/cron/referral-nudge
 *
 * Sends a one-time WhatsApp 24h after a 5⭐ review, with the customer's referral link.
 * A claim row is written before the provider call. SENT is recorded only after
 * Meta accepts the message. Skip and failure release the claim. Delivery
 * confirmation is recorded later by the WhatsApp status webhook.
 *
 * Auth: Bearer CRON_SECRET. A missing or empty secret rejects the request.
 * Manual test: GET /api/cron/referral-nudge with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const REFERRAL_NUDGE_SENT = 'REFERRAL_NUDGE_SENT';
const REFERRAL_NUDGE_CLAIM = 'REFERRAL_NUDGE_CLAIM';

const MS_PER_MIN = 60 * 1000;
const TARGET_HOURS = 24;
const WINDOW_HALF_HOURS = 1; // 23–25h

export async function GET(request: NextRequest) {
  try {
    const authError = verifyCronAuth(request);
    if (authError) return authError;

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
        action: { in: [REFERRAL_NUDGE_SENT, REFERRAL_NUDGE_CLAIM] },
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
    let failed = 0;
    let skipped = 0;
    let acceptedUnrecorded = 0;
    for (const r of ratings) {
      if (sentSet.has(r.jobId)) continue;
      const phone = r.Job?.Customer?.phone?.trim();
      const customerId = r.Job?.customerId;
      const branchId = r.Job?.branchId;
      if (!phone) {
        skipped++;
        continue;
      }

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

      const claimId = await logAuditEntry({
        action: REFERRAL_NUDGE_CLAIM,
        entityType: 'Job',
        entityId: r.jobId,
        description: 'Referral nudge claimed before the WhatsApp provider call',
        changes: { status: 'claimed' },
      });
      if (!claimId) {
        skipped++;
        continue;
      }
      sentSet.add(r.jobId);

      const result = await sendWhatsAppMessage({ to: phone, message });
      if (result.status === 'accepted' && result.providerMessageId) {
        try {
          await prisma.auditLog.update({
            where: { id: claimId },
            data: {
              action: REFERRAL_NUDGE_SENT,
              description: 'Referral nudge accepted by the WhatsApp provider',
              changes: {
                status: 'accepted',
                deliveryStatus: 'accepted',
                providerMessageId: result.providerMessageId,
                acceptedAt: new Date().toISOString(),
              },
            },
          });
          sent++;
        } catch (error) {
          console.error('[cron/referral-nudge] accepted message was not recorded', {
            jobId: r.jobId,
            message: error instanceof Error ? error.message : 'update failed',
          });
          acceptedUnrecorded++;
        }
        continue;
      }

      await prisma.auditLog.deleteMany({
        where: { id: claimId, action: REFERRAL_NUDGE_CLAIM },
      });
      sentSet.delete(r.jobId);
      if (result.status === 'failed') failed++;
      else skipped++;
    }

    return NextResponse.json({ ok: true, sent, failed, skipped, acceptedUnrecorded });
  } catch (err) {
    console.error('[cron/referral-nudge]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Referral nudge cron failed' },
      { status: 500 }
    );
  }
}
