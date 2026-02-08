export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/jobs/[jobId]/weather-delay
 * Mark job as weather-delayed and send one-time WhatsApp to customer.
 * Duplicate sends prevented via audit WEATHER_DELAY_ALERT_SENT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { sendWeatherDelayAlertForJob } from '@/lib/notifications/weatherDelayAlert';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const jobId = params.jobId;
    if (!jobId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const sent = await sendWeatherDelayAlertForJob(jobId);
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    if (err instanceof NextResponse) throw err;
    console.error('[admin/jobs/weather-delay]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Weather delay alert failed' },
      { status: 500 }
    );
  }
}
