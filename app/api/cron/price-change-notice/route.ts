export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Price-Change Notice (Cron)
 * GET /api/cron/price-change-notice?changeId={{id}}
 *
 * Sends a one-time WhatsApp per affected customer per price change. Config from env.
 * Duplicates prevented via audit log (one send per customer per change).
 *
 * Auth: Bearer CRON_SECRET
 * Config: PRICE_CHANGE_NOTICES JSON, e.g.:
 *   {"spring-2025":{"effectiveDate":"March 1, 2025","pricingLink":"https://velocitymaid.com/pricing","branchId":"optional-branch-id"}}
 *   If branchId is set, only customers with at least one job in that branch are notified.
 * Manual test: GET /api/cron/price-change-notice?changeId=spring-2025 with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'PRICE_CHANGE_NOTIFIED';

function getChanges(): Record<
  string,
  { effectiveDate: string; pricingLink: string; branchId?: string }
> {
  const raw = process.env.PRICE_CHANGE_NOTICES;
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      { effectiveDate?: string; pricingLink?: string; branchId?: string }
    >;
    const out: Record<
      string,
      { effectiveDate: string; pricingLink: string; branchId?: string }
    > = {};
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(
      /\/$/,
      ''
    );
    for (const [id, c] of Object.entries(parsed)) {
      if (c && typeof c.effectiveDate === 'string' && c.effectiveDate.trim())
        out[id] = {
          effectiveDate: c.effectiveDate.trim(),
          pricingLink:
            typeof c.pricingLink === 'string' && c.pricingLink.trim()
              ? c.pricingLink.trim()
              : `${baseUrl}/book`,
          branchId: typeof c.branchId === 'string' && c.branchId.trim() ? c.branchId.trim() : undefined,
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
    const changeId = searchParams.get('changeId')?.trim();
    if (!changeId) {
      return NextResponse.json(
        { error: 'Query parameter changeId is required' },
        { status: 400 }
      );
    }

    const changes = getChanges();
    const change = changes[changeId];
    if (!change) {
      return NextResponse.json(
        { error: `Price change "${changeId}" not found. Set PRICE_CHANGE_NOTICES in env.` },
        { status: 400 }
      );
    }

    let customerIds: string[];

    if (change.branchId) {
      const jobs = await prisma.job.findMany({
        where: { branchId: change.branchId, customerId: { not: null } },
        select: { customerId: true },
        distinct: ['customerId'],
      });
      customerIds = jobs.map((j) => j.customerId!).filter(Boolean);
    } else {
      const customers = await prisma.customer.findMany({
        where: { phone: { not: null } },
        select: { id: true },
      });
      customerIds = customers.map((c) => c.id);
    }

    if (customerIds.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: ACTION,
        entityType: 'Customer',
        entityId: { in: customerIds },
        changes: { equals: { changeId } },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds }, phone: { not: null } },
      select: { id: true, phone: true },
    });

    const message = [
      'ℹ️ Pricing Update from VelocityMaid',
      '',
      `Starting ${change.effectiveDate}, our rates will change slightly to continue delivering quality service.`,
      '',
      'View details here:',
      change.pricingLink,
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
        description: `Price change notice "${changeId}" sent`,
        changes: { changeId },
      });
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/price-change-notice]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Price change notice cron failed' },
      { status: 500 }
    );
  }
}
