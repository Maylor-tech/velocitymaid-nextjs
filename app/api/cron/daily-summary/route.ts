export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Ops Summary (Cron)
 * GET /api/cron/daily-summary
 *
 * Sends a calm daily summary to branch admins (e.g. Laura) via WhatsApp at 6:30 PM local time per branch.
 * No UI, no blocking. If WhatsApp is not configured, skips silently.
 *
 * Auth: Bearer CRON_SECRET
 * Query: ?branchId=xxx to run for one branch only (skips 6:30 PM check; for testing).
 *
 * Manual test: GET /api/cron/daily-summary?branchId=<id> with Authorization: Bearer <CRON_SECRET>
 * Disable WhatsApp: clear WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID → endpoint still 200, no errors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import {
  is630PMInTimezone,
  getStartOfTodayUTC,
  getStartOfTomorrowUTC,
  getTodayDateStringInTimezone,
} from '@/lib/cron/dailySummaryUtils';

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
      if (!branchIdParam && !is630PMInTimezone(timezone)) {
        continue;
      }

      const todayStart = getStartOfTodayUTC(timezone);
      const tomorrowStart = getStartOfTomorrowUTC(timezone);
      const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);
      const dateLabel = getTodayDateStringInTimezone(timezone);

      const [completed, tomorrowScheduled, issuesCount, cleanersActive] = await Promise.all([
        prisma.job.count({
          where: {
            branchId: branch.id,
            status: 'COMPLETED',
            completedAt: { gte: todayStart, lt: tomorrowStart },
          },
        }),
        prisma.job.count({
          where: {
            branchId: branch.id,
            preferredDate: { gte: tomorrowStart, lt: tomorrowEnd },
            status: { in: ['CONFIRMED', 'ASSIGNED'] },
          },
        }),
        prisma.complianceIssue.count({
          where: {
            job: { branchId: branch.id },
            status: { in: ['OPEN', 'ESCALATED'] },
          },
        }),
        prisma.user.count({
          where: {
            role: 'CLEANER',
            isActive: true,
            primaryBranchId: branch.id,
          },
        }),
      ]);

      const adminsWithPhone = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          phone: { not: null },
          UserBranch: { some: { branchId: branch.id } },
        },
        select: { phone: true },
      });

      const message = [
        `📊 Daily Ops Summary — ${dateLabel}`,
        '',
        `• Jobs completed: ${completed}`,
        `• Jobs scheduled (tomorrow): ${tomorrowScheduled}`,
        `• Issues/escalations: ${issuesCount}`,
        `• Cleaners active: ${cleanersActive}`,
        '',
        'Reply "DETAILS" if you need more.',
        '— VelocityMaid',
      ].join('\n');

      for (const admin of adminsWithPhone) {
        const phone = admin.phone?.trim();
        if (!phone) continue;
        sendWhatsAppMessage({ to: phone, message }).catch(() => {});
        sent++;
      }
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('[cron/daily-summary]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Daily summary failed' },
      { status: 500 }
    );
  }
}
