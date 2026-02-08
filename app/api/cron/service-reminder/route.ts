export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Service Reminder (Cron)
 * GET /api/cron/service-reminder
 *
 * Sends a one-time WhatsApp to the customer before the scheduled clean
 * (e.g. evening before or 2 hours before, configurable). Reduces no-shows.
 * Duplicates prevented via audit log. Skips cancelled jobs.
 *
 * Auth: Bearer CRON_SECRET
 * Config: SERVICE_REMINDER_HOURS_BEFORE (default 2) = send when job is this many hours away
 * Manual test: GET /api/cron/service-reminder with Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'SERVICE_REMINDER_SENT';
const MS_PER_HOUR = 60 * 60 * 1000;
const WINDOW_LENGTH_HOURS = 1; // 1-hour window so hourly cron catches each job once

function getHoursBefore(): number {
  const raw = process.env.SERVICE_REMINDER_HOURS_BEFORE;
  if (raw == null || raw === '') return 2;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 2;
}

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

function isInReminderWindow(
  preferredDate: Date | null,
  preferredTime: string | null,
  hoursBefore: number
): boolean {
  if (!preferredDate) return false;
  const start = parseStartTime(new Date(preferredDate), preferredTime);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / MS_PER_HOUR;
  const windowEnd = hoursBefore + WINDOW_LENGTH_HOURS;
  return diffHours >= hoursBefore && diffHours <= windowEnd;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hoursBefore = getHoursBefore();
    const now = new Date();
    const windowStart = new Date(now.getTime() + hoursBefore * MS_PER_HOUR);
    const windowEnd = new Date(
      now.getTime() + (hoursBefore + WINDOW_LENGTH_HOURS) * MS_PER_HOUR
    );
    const dateFrom = new Date(windowStart);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(windowEnd);
    dateTo.setDate(dateTo.getDate() + 1);
    dateTo.setHours(0, 0, 0, 0);

    const jobs = await prisma.job.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
        customerId: { not: null },
        preferredDate: { gte: dateFrom, lt: dateTo },
      },
      select: {
        id: true,
        preferredDate: true,
        preferredTime: true,
        Customer: { select: { phone: true } },
      },
    });

    const alreadySent = await prisma.auditLog.findMany({
      where: {
        action: ACTION,
        entityType: 'Job',
        entityId: { in: jobs.map((j) => j.id) },
      },
      select: { entityId: true },
    });
    const sentSet = new Set(alreadySent.map((a) => a.entityId));

    let sent = 0;
    for (const job of jobs) {
      if (sentSet.has(job.id)) continue;
      if (!isInReminderWindow(job.preferredDate, job.preferredTime, hoursBefore)) continue;

      const customerPhone = job.Customer?.phone?.trim();
      if (!customerPhone) continue;

      const startTime = parseStartTime(
        new Date(job.preferredDate!),
        job.preferredTime
      );
      const dateStr = new Date(job.preferredDate!).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr =
        job.preferredTime ||
        startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

      const message = [
        '⏰ Friendly Reminder from VelocityMaid',
        '',
        'Your cleaning is scheduled for:',
        `🗓 ${dateStr}`,
        `⏰ ${timeStr}`,
        '',
        'We look forward to serving you.',
        '— VelocityMaid',
      ].join('\n');

      sendWhatsAppMessage({ to: customerPhone, message }).catch(() => {});

      await logAuditEntry({
        action: ACTION,
        entityType: 'Job',
        entityId: job.id,
        description: 'Service reminder WhatsApp sent to customer',
        changes: { sentAt: new Date().toISOString() },
      });
      sentSet.add(job.id);
      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/service-reminder]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Service reminder cron failed' },
      { status: 500 }
    );
  }
}
