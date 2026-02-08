export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Seasonal Promo (Cron)
 * GET /api/cron/seasonal-promo?campaign={{id}}
 *
 * Sends a one-time WhatsApp per customer per campaign. Campaign config from env.
 * Duplicates prevented via audit log (one send per customer per campaign).
 *
 * Auth: Bearer CRON_SECRET
 * Config: SEASONAL_PROMO_CAMPAIGNS JSON, e.g.:
 *   {"spring-2025":{"name":"Spring Clean 2025","details":"20% off deep cleans.","bookingLink":"https://velocitymaid.com/book?branch=new-jersey&promo=spring"}}
 * Manual test: GET /api/cron/seasonal-promo?campaign=spring-2025 with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'SEASONAL_PROMO_SENT';

function getCampaigns(): Record<string, { name: string; details: string; bookingLink: string }> {
  const raw = process.env.SEASONAL_PROMO_CAMPAIGNS;
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, { name?: string; details?: string; bookingLink?: string }>;
    const out: Record<string, { name: string; details: string; bookingLink: string }> = {};
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
    for (const [id, c] of Object.entries(parsed)) {
      if (c && typeof c.name === 'string' && typeof c.details === 'string')
        out[id] = {
          name: c.name,
          details: c.details,
          bookingLink: typeof c.bookingLink === 'string' && c.bookingLink
            ? c.bookingLink
            : `${baseUrl}/book`,
        };
    }
    return out;
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign')?.trim();
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Query parameter campaign is required' },
        { status: 400 }
      );
    }

    const campaigns = getCampaigns();
    const campaign = campaigns[campaignId];
    if (!campaign) {
      return NextResponse.json(
        { error: `Campaign "${campaignId}" not found. Set SEASONAL_PROMO_CAMPAIGNS in env.` },
        { status: 400 }
      );
    }

    const customers = await prisma.customer.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const customerIds = customers.map((c) => c.id);
    if (customerIds.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: ACTION,
        entityType: 'Customer',
        entityId: { in: customerIds },
        changes: { equals: { campaignId } },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    const message = [
      '🌿 Seasonal Special from VelocityMaid!',
      '',
      `${campaign.name} is live:`,
      campaign.details,
      '',
      'Book here:',
      campaign.bookingLink,
      '',
      '— VelocityMaid',
    ].join('\n');

    let sent = 0;
    for (const c of customers) {
      if (sentSet.has(c.id)) continue;
      const phone = c.phone?.trim();
      if (!phone) continue;

      sendWhatsAppMessage({ to: phone, message }).catch(() => {});

      await logAuditEntry({
        action: ACTION,
        entityType: 'Customer',
        entityId: c.id,
        description: `Seasonal promo "${campaign.name}" sent`,
        changes: { campaignId },
      });
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/seasonal-promo]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Seasonal promo cron failed' },
      { status: 500 }
    );
  }
}
