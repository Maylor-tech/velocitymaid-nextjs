export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/branches/[branchId]/weather-delay
 * Mark area (branch) as weather-delayed: send one-time alert per affected job for today.
 * branchId is branch slug. Duplicate sends prevented per job via audit WEATHER_DELAY_ALERT_SENT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { sendWeatherDelayAlertForJob } from '@/lib/notifications/weatherDelayAlert';
import { prisma } from '@/lib/prisma';

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfTodayUTC(): Date {
  const d = startOfTodayUTC();
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const slug = params.branchId;
    if (!slug) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const branch = await prisma.branch.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const start = startOfTodayUTC();
    const end = endOfTodayUTC();
    const jobs = await prisma.job.findMany({
      where: {
        branchId: branch.id,
        customerId: { not: null },
        status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
        preferredDate: { gte: start, lt: end },
      },
      select: { id: true },
    });

    let sent = 0;
    for (const job of jobs) {
      const ok = await sendWeatherDelayAlertForJob(job.id);
      if (ok) sent++;
    }

    return NextResponse.json({ ok: true, sent, jobs: jobs.length });
  } catch (err) {
    if (err instanceof NextResponse) throw err;
    console.error('[admin/branches/weather-delay]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Weather delay alert failed' },
      { status: 500 }
    );
  }
}
