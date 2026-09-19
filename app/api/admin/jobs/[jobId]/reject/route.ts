export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobReviewStatus, JobStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { logAuditEntry } from '@/lib/audit';
import { refundDepositForRejectedJob } from '@/lib/booking/depositRefund';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';
import { notifyCleanerOfJobCancellation } from '@/lib/notifications/cleanerCancellationEmail';
import { applyAdminTerminalCancellation } from '@/lib/admin/applyAdminTerminalCancellation';
import { isDispatchError } from '@/lib/dispatch/errors';

/**
 * POST /api/admin/jobs/[jobId]/reject
 * Reject a deposit-paid booking and refund the deposit when possible.
 * Terminal cancel + assignment clear commit before refund so a refund
 * failure cannot leave an orphaned assignment on a cancelled job.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { jobId } = params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : null;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (job.paymentStatus !== PaymentStatus.DEPOSIT_PAID) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only deposit-paid bookings awaiting review can be rejected',
          code: 'INVALID_PAYMENT_STATUS',
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const cancelReason = reason || 'Rejected by admin during booking review';

    const cancelResult = await applyAdminTerminalCancellation({
      jobId,
      adminId: auth.userId,
      nextStatus: JobStatus.CANCELLED,
      reasonLabel: 'Admin rejected booking',
      reasonCode: 'ADMIN_REJECTED',
      notes: reason,
      extraJobData: {
        reviewStatus: JobReviewStatus.REJECTED,
        cancellationReason: cancelReason,
        cancelledAt: now,
        approvedById: auth.userId,
        approvedAt: now,
      },
    });

    const refund = await refundDepositForRejectedJob(jobId, auth.userId);

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: 'ADMIN',
      action: 'JOB_BOOKING_REJECTED',
      entityType: 'Job',
      entityId: jobId,
      description: reason || 'Deposit booking rejected',
      changes: {
        refund,
        releasedCleanerId: cancelResult.releasedCleanerId,
        acceptedOfferId: cancelResult.acceptedOffer?.id ?? null,
      },
    });

    await awaitJobCalendarCancel(jobId);

    if (cancelResult.releasedCleanerId) {
      await notifyCleanerOfJobCancellation({
        jobId,
        cleanerId: cancelResult.releasedCleanerId,
        triggeredBy: 'admin',
      }).catch(() => {});
    }

    const jobAfterRefund = await prisma.job.findUnique({ where: { id: jobId } });

    const refundWarning =
      refund.status === 'failed'
        ? `Booking rejected but deposit refund failed: ${refund.error}`
        : refund.status === 'skipped'
          ? `Booking rejected. Deposit not refunded: ${refund.reason}`
          : null;

    return NextResponse.json({
      success: true,
      job: jobAfterRefund ?? {
        ...cancelResult.job,
        id: jobId,
      },
      refund,
      warning: refundWarning,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    if (isDispatchError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[JOB REJECT]', error);
    const message = error instanceof Error ? error.message : 'Failed to reject booking';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
