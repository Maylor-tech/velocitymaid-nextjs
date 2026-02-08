export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * "Cleaner on the Way" WhatsApp notification (Cron)
 * GET /api/cron/on-the-way
 *
 * Sends a one-time WhatsApp to the customer ~60 minutes before job start.
 * Only for ASSIGNED jobs. Duplicates prevented via audit log.
 *
 * Auth: Bearer CRON_SECRET
 * Manual test: GET /api/cron/on-the-way with Authorization: Bearer <CRON_SECRET>
 * Re-run → no duplicate (same job not sent again).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const MS_PER_MIN = 60 * 1000;
const WINDOW_START_MIN = 55;
const WINDOW_END_MIN = 65;

function parseStartTime(date: Date, time?: string | null): Date {
  if (!time) return new Date(date);
  const match = String(time).match(/(\d+):?(\d+)?\s*(AM|PM)?/i);
  if (!match) return new Date(date);

  let hour = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridian = match[3]?.toUpperCase();

  if (meridian === 'PM' && hour < 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;

  const d = new Date(date);
  d.setHours(hour, minutes, 0, 0);
  return d;
}

function isIn60MinWindow(preferredDate: Date | null, preferredTime: string | null): boolean {
  if (!preferredDate) return false;
  const start = parseStartTime(new Date(preferredDate), preferredTime);
  const now = new Date();
  const diffMin = (start.getTime() - now.getTime()) / MS_PER_MIN;
  return diffMin >= WINDOW_START_MIN && diffMin <= WINDOW_END_MIN;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(todayStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
    tomorrowEnd.setHours(0, 0, 0, 0);

    const jobs = await prisma.job.findMany({
      where: {
        status: 'ASSIGNED',
        preferredDate: { gte: todayStart, lt: tomorrowEnd },
        assignedCleanerId: { not: null },
      },
      select: {
        id: true,
        preferredDate: true,
        preferredTime: true,
        Customer: { select: { phone: true } },
        User: { select: { name: true } },
      },
    });

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: 'ON_THE_WAY_NOTIFICATION_SENT',
        entityType: 'Job',
        entityId: { in: jobs.map((j) => j.id) },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    let sent = 0;
    for (const job of jobs) {
      if (sentSet.has(job.id)) continue;
      if (!isIn60MinWindow(job.preferredDate, job.preferredTime)) continue;

      const customerPhone = job.Customer?.phone?.trim();
      if (!customerPhone) continue;

      const cleanerName = job.User?.name || 'Your cleaner';
      const startTime = parseStartTime(
        new Date(job.preferredDate!),
        job.preferredTime
      );
      const timeStr =
        job.preferredTime ||
        startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

      const message = [
        '🚗 Your cleaner is on the way!',
        '',
        `🧹 ${cleanerName}`,
        `⏰ ETA: ${timeStr}`,
        '',
        'See you soon.',
        '— VelocityMaid',
      ].join('\n');

      sendWhatsAppMessage({ to: customerPhone, message }).catch(() => {});

      await logAuditEntry({
        action: 'ON_THE_WAY_NOTIFICATION_SENT',
        entityType: 'Job',
        entityId: job.id,
        description: 'On-the-way WhatsApp sent to customer',
        changes: { sentAt: new Date().toISOString() },
      });
      sentSet.add(job.id);
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/on-the-way]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'On-the-way cron failed' },
      { status: 500 }
    );
  }
}
