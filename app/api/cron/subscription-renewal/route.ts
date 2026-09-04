export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Subscription Renewal Reminder (Cron)
 * GET /api/cron/subscription-renewal
 *
 * Sends a one-time WhatsApp per renewal cycle (e.g. 3 days before current_period_end).
 * Skips paused/cancelled. Duplicates prevented via audit (one per subscription per period).
 *
 * Auth: Bearer CRON_SECRET
 * Config: SUBSCRIPTION_RENEWAL_DAYS_BEFORE (default 3)
 * Manual test: GET /api/cron/subscription-renewal with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'SUBSCRIPTION_RENEWAL_REMINDER_SENT';
const ACTIVE_STATUSES = ['active', 'trialing'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDaysBefore(): number {
  const raw = process.env.SUBSCRIPTION_RENEWAL_DAYS_BEFORE;
  if (raw == null || raw === '') return 3;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 3;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = getStripe();
    const daysBefore = getDaysBefore();
    const now = new Date();
    const windowStart = new Date(now.getTime() + daysBefore * MS_PER_DAY);
    const windowEnd = new Date(windowStart.getTime() + MS_PER_DAY);
    const windowStartSec = Math.floor(windowStart.getTime() / 1000);
    const windowEndSec = Math.floor(windowEnd.getTime() / 1000);

    const response = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
    });
    const subscriptions: { id: string; customer: string; current_period_end: number }[] = [];
    for (const sub of response.data ?? []) {
      if (!ACTIVE_STATUSES.includes(sub.status)) continue;
      const periodEnd =
        'currentPeriodEnd' in sub && typeof sub.currentPeriodEnd === 'number'
          ? sub.currentPeriodEnd
          : Number((sub as { current_period_end?: number }).current_period_end);
      if (periodEnd >= windowStartSec && periodEnd < windowEndSec) {
        const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as { id?: string })?.id;
        if (customerId) {
          subscriptions.push({
            id: sub.id,
            customer: customerId,
            current_period_end: periodEnd,
          });
        }
      }
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
    const manageLink = `${baseUrl}/customer/subscriptions`;

    let sent = 0;
    for (const sub of subscriptions) {
      const periodEndIso = new Date(sub.current_period_end * 1000).toISOString();
      const auditEntityId = `${sub.id}_${periodEndIso}`;

      const existing = await prisma.auditLog.findFirst({
        where: {
          action: ACTION,
          entityType: 'Subscription',
          entityId: auditEntityId,
        },
      });
      if (existing) continue;

      const customer = await prisma.customer.findFirst({
        where: { stripeCustomerId: sub.customer },
        select: { id: true, phone: true },
      });
      const phone = customer?.phone?.trim();
      if (!phone) continue;

      const dateStr = new Date(sub.current_period_end * 1000).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const message = [
        '🔁 Subscription Renewal Reminder',
        '',
        `Your VelocityMaid plan renews on ${dateStr}.`,
        'Manage or update your plan here:',
        manageLink,
        '',
        '— VelocityMaid',
      ].join('\n');

      sendWhatsAppMessage({ to: phone, message }).catch(() => {});

      await logAuditEntry({
        action: ACTION,
        entityType: 'Subscription',
        entityId: auditEntityId,
        description: 'Subscription renewal reminder sent',
        changes: { periodEnd: periodEndIso, stripeSubscriptionId: sub.id },
      });
      sent++;
    }

    return NextResponse.json({ ok: true, sent, subscriptions: subscriptions.length });
  } catch (err) {
    console.error('[cron/subscription-renewal]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Subscription renewal cron failed' },
      { status: 500 }
    );
  }
}
