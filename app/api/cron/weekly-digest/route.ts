export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Weekly Ops Digest (Cron)
 * GET /api/cron/weekly-digest
 *
 * Sends a weekly snapshot to branch admins (e.g. Laura) via WhatsApp
 * Mondays at 8:00 AM branch local time. Previous week (Mon–Sun).
 * One send per branch per week (audit guard).
 *
 * Auth: Bearer CRON_SECRET
 * Query: ?branchId=xxx to run for one branch only (skips time check; for testing).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';
import {
  isMonday8AMInTimezone,
  getPreviousWeekStartUTC,
  getPreviousWeekEndUTC,
  getPreviousWeekRangeLabel,
} from '@/lib/cron/dailySummaryUtils';

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

/** Unique key for the week (Monday date in branch TZ) for audit dedup. */
function getWeekKey(timezone: string, weekStartUTC: Date): string {
  return weekStartUTC.toLocaleDateString('en-CA', { timeZone: timezone });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get('branchId');

    const branches = branchIdParam
      ? await prisma.branch.findMany({ where: { id: branchIdParam } })
      : await prisma.branch.findMany();

    let sent = 0;

    for (const branch of branches) {
      const timezone = branch.timezone || 'America/New_York';
      if (!branchIdParam && !isMonday8AMInTimezone(timezone)) {
        continue;
      }

      const weekStart = getPreviousWeekStartUTC(timezone);
      const weekEnd = getPreviousWeekEndUTC(timezone);
      const weekKey = getWeekKey(timezone, weekStart);

      const alreadySent = await prisma.auditLog.findFirst({
        where: {
          action: 'WEEKLY_DIGEST_SENT',
          entityType: 'Branch',
          entityId: branch.id,
          changes: { equals: { week: weekKey } },
        },
      });
      if (alreadySent) continue;

      const completedJobs = await prisma.job.findMany({
        where: {
          branchId: branch.id,
          status: 'COMPLETED',
          completedAt: { gte: weekStart, lte: weekEnd },
        },
        select: {
          id: true,
          preferredDate: true,
          preferredTime: true,
          onTheWayAt: true,
        },
      });

      const completedCount = completedJobs.length;

      let onTimeCount = 0;
      for (const j of completedJobs) {
        if (!j.onTheWayAt || !j.preferredDate) continue;
        const start = parseStartTime(new Date(j.preferredDate), j.preferredTime);
        const bufferEnd = new Date(start.getTime() + 15 * 60 * 1000);
        if (new Date(j.onTheWayAt) <= bufferEnd) onTimeCount++;
      }
      const onTimePct = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0;

      const completedIds = completedJobs.map((j) => j.id);
      const payoutResult = await prisma.cleanerBalanceLedger.aggregate({
        where: {
          jobId: { in: completedIds },
          amountCents: { gt: 0 },
        },
        _sum: { amountCents: true },
      });
      const totalCents = payoutResult._sum?.amountCents ?? 0;
      const avgPayoutCents = completedCount > 0 ? Math.round(totalCents / completedCount) : 0;
      const avgPayoutStr =
        avgPayoutCents > 0 ? `$${(avgPayoutCents / 100).toFixed(2)}` : '—';

      const [newBookings, issuesCount] = await Promise.all([
        prisma.job.count({
          where: {
            branchId: branch.id,
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        }),
        prisma.complianceIssue.count({
          where: {
            job: { branchId: branch.id },
            status: { in: ['OPEN', 'ESCALATED'] },
          },
        }),
      ]);

      const weekRangeLabel = getPreviousWeekRangeLabel(timezone);

      const message = [
        `📈 Weekly Ops Digest — ${weekRangeLabel}`,
        '',
        `• Jobs completed: ${completedCount}`,
        `• On-time rate: ${onTimePct}%`,
        `• Avg payout/job: ${avgPayoutStr}`,
        `• New bookings: ${newBookings}`,
        `• Escalations: ${issuesCount}`,
        '',
        'Have a great week.',
        '— VelocityMaid',
      ].join('\n');

      const adminsWithPhone = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          phone: { not: null },
          UserBranch: { some: { branchId: branch.id } },
        },
        select: { phone: true },
      });

      for (const admin of adminsWithPhone) {
        const phone = admin.phone?.trim();
        if (!phone) continue;
        sendWhatsAppMessage({ to: phone, message }).catch(() => {});
        sent++;
      }

      await logAuditEntry({
        action: 'WEEKLY_DIGEST_SENT',
        entityType: 'Branch',
        entityId: branch.id,
        description: `Weekly digest sent for week ${weekKey}`,
        changes: { week: weekKey },
      });
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/weekly-digest]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Weekly digest failed' },
      { status: 500 }
    );
  }
}
