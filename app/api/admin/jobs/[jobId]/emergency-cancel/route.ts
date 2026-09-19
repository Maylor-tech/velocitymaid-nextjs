export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/jobs/[jobId]/emergency-cancel
 * Mark job as emergency-cancelled and send one-time WhatsApp to customer.
 * Duplicate sends prevented via audit EMERGENCY_CANCEL_NOTICE_SENT.
 *
 * Terminal CANCELLED_EMERGENCY + assignment clear are atomic. Cleaner
 * notification uses the pre-clear releasedCleanerId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { sendEmergencyCancelNoticeForJob } from '@/lib/notifications/emergencyCancelNotice';
import { JobStatus } from '@prisma/client';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';
import { notifyCleanerOfJobCancellation } from '@/lib/notifications/cleanerCancellationEmail';
import { applyAdminTerminalCancellation } from '@/lib/admin/applyAdminTerminalCancellation';
import { isDispatchError } from '@/lib/dispatch/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const jobId = params.jobId;
    if (!jobId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const now = new Date();
    const cancelResult = await applyAdminTerminalCancellation({
      jobId,
      adminId: auth.userId,
      nextStatus: JobStatus.CANCELLED_EMERGENCY,
      reasonLabel: 'Emergency cancellation',
      reasonCode: 'EMERGENCY',
      notes: null,
      blockCompleted: true,
      extraJobData: {
        cancelledAt: now,
        cancellationReason: 'Emergency cancellation',
      },
      auditAction: 'JOB_EMERGENCY_CANCELLED',
      auditDescription: `Emergency cancelled ${jobId}`,
    });

    // Await Calendar cancel in this request — emergency cancel already committed.
    await awaitJobCalendarCancel(jobId);

    if (cancelResult.releasedCleanerId) {
      await notifyCleanerOfJobCancellation({
        jobId,
        cleanerId: cancelResult.releasedCleanerId,
        triggeredBy: 'admin',
      }).catch(() => {});
    }

    const sent = await sendEmergencyCancelNoticeForJob(jobId);
    return NextResponse.json({
      ok: true,
      sent,
      releasedCleanerId: cancelResult.releasedCleanerId,
      assignedCleanerId: cancelResult.job.assignedCleanerId,
    });
  } catch (err) {
    if (err instanceof NextResponse) throw err;
    if (isDispatchError(err)) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('[admin/jobs/emergency-cancel]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Emergency cancel failed' },
      { status: 500 }
    );
  }
}
