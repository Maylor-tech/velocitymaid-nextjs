export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/jobs/[jobId]/emergency-cancel
 * Mark job as emergency-cancelled and send one-time WhatsApp to customer.
 * Duplicate sends prevented via audit EMERGENCY_CANCEL_NOTICE_SENT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { sendEmergencyCancelNoticeForJob } from '@/lib/notifications/emergencyCancelNotice';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';
import { cancelOpenOffersForJob } from '@/lib/dispatch/jobOffer';

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
      select: { id: true, status: true },
    });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (job.status === JobStatus.CANCELLED || job.status === JobStatus.CANCELLED_EMERGENCY) {
      return NextResponse.json(
        { error: 'Job is already cancelled' },
        { status: 400 }
      );
    }
    if (job.status === JobStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Cannot cancel a completed job' },
        { status: 400 }
      );
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.CANCELLED_EMERGENCY,
        cancelledAt: new Date(),
        cancellationReason: 'Emergency cancellation',
      },
    });

    await cancelOpenOffersForJob(jobId);

    // Await Calendar cancel in this request — emergency cancel already committed.
    await awaitJobCalendarCancel(jobId);

    const sent = await sendEmergencyCancelNoticeForJob(jobId);
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    if (err instanceof NextResponse) throw err;
    console.error('[admin/jobs/emergency-cancel]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Emergency cancel failed' },
      { status: 500 }
    );
  }
}
