export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Win-Back Reminder (Cron)
 * GET /api/cron/winback
 *
 * Sends a one-time WhatsApp to customers inactive 45+ days (last completed job, no new bookings).
 * Duplicates prevented via audit log (one send per inactivity period).
 *
 * Auth: Bearer CRON_SECRET
 * Manual test: GET /api/cron/winback with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const INACTIVE_DAYS = 45;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - INACTIVE_DAYS * MS_PER_DAY);

    const winbackOffer =
      process.env.WINBACK_OFFER || '10% off your next clean';
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(
      /\/$/,
      ''
    );

    const completedJobs = await prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { lte: cutoff },
        customerId: { not: null },
        Customer: { phone: { not: null } },
      },
      select: {
        id: true,
        customerId: true,
        completedAt: true,
        branchId: true,
        Branch: { select: { slug: true } },
        Customer: { select: { phone: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    const lastByCustomer = new Map<string, { completedAt: Date; branchSlug: string; phone: string }>();
    for (const j of completedJobs) {
      const cid = j.customerId!;
      if (lastByCustomer.has(cid)) continue;
      lastByCustomer.set(cid, {
        completedAt: j.completedAt!,
        branchSlug: j.Branch?.slug || 'new-jersey',
        phone: j.Customer!.phone!.trim(),
      });
    }

    const customerIds = [...lastByCustomer.keys()];
    if (customerIds.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    const jobsAfterCutoff = await prisma.job.findMany({
      where: {
        customerId: { in: customerIds },
        createdAt: { gt: cutoff },
      },
      select: { customerId: true, createdAt: true },
    });
    const hasNewBooking = new Set<string>();
    for (const j of jobsAfterCutoff) {
      const cid = j.customerId!;
      const last = lastByCustomer.get(cid);
      if (last && j.createdAt > last.completedAt) hasNewBooking.add(cid);
    }

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: 'WINBACK_SENT',
        entityType: 'Customer',
        entityId: { in: customerIds },
      },
      select: { entityId: true, changes: true },
    });
    const sentByLastCompleted = new Map<string, string>();
    for (const a of alreadySent) {
      const ch = a.changes as { lastCompletedAt?: string } | null;
      if (ch?.lastCompletedAt) sentByLastCompleted.set(a.entityId, ch.lastCompletedAt);
    }

    let sent = 0;
    for (const customerId of customerIds) {
      if (hasNewBooking.has(customerId)) continue;
      const info = lastByCustomer.get(customerId);
      if (!info?.phone) continue;

      const lastCompletedAt = info.completedAt.toISOString();
      if (sentByLastCompleted.get(customerId) === lastCompletedAt) continue;

      const bookingLink = `${baseUrl}/book?branch=${info.branchSlug}`;
      const message = [
        '👋 We miss you at VelocityMaid!',
        '',
        `Ready for your next clean? Here's ${winbackOffer} to make it easy:`,
        bookingLink,
        '',
        '— VelocityMaid',
      ].join('\n');

      sendWhatsAppMessage({ to: info.phone, message }).catch(() => {});

      await logAuditEntry({
        action: 'WINBACK_SENT',
        entityType: 'Customer',
        entityId: customerId,
        description: 'Win-back WhatsApp sent',
        changes: { lastCompletedAt },
      });
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/winback]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Winback cron failed' },
      { status: 500 }
    );
  }
}
