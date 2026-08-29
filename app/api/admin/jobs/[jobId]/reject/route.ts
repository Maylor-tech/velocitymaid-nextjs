export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobReviewStatus, JobStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { logAuditEntry } from '@/lib/audit';
import { refundDepositForRejectedJob } from '@/lib/booking/depositRefund';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';
import { cancelOpenOffersForJob } from '@/lib/dispatch/jobOffer';

/**
 * POST /api/admin/jobs/[jobId]/reject
 * Reject a deposit-paid booking and refund the deposit when possible.
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

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        reviewStatus: JobReviewStatus.REJECTED,
        status: JobStatus.CANCELLED,
        cancellationReason: reason || 'Rejected by admin during booking review',
        cancelledAt: new Date(),
        approvedById: auth.userId,
        approvedAt: new Date(),
      },
    });

    const refund = await refundDepositForRejectedJob(jobId, auth.userId);
    await cancelOpenOffersForJob(jobId, auth.userId);

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: 'ADMIN',
      action: 'JOB_BOOKING_REJECTED',
      entityType: 'Job',
      entityId: jobId,
      description: reason || 'Deposit booking rejected',
      changes: { refund },
    });

    await awaitJobCalendarCancel(jobId);

    const jobAfterRefund = await prisma.job.findUnique({ where: { id: jobId } });

    const refundWarning =
      refund.status === 'failed'
        ? `Booking rejected but deposit refund failed: ${refund.error}`
        : refund.status === 'skipped'
          ? `Booking rejected. Deposit not refunded: ${refund.reason}`
          : null;

    return NextResponse.json({
      success: true,
      job: jobAfterRefund ?? updated,
      refund,
      warning: refundWarning,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[JOB REJECT]', error);
    const message = error instanceof Error ? error.message : 'Failed to reject booking';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
