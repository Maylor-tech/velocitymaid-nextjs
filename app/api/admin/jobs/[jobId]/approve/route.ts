export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobReviewStatus, JobStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { logAuditEntry } from '@/lib/audit';
import { createClientJobFolder } from '@/lib/google/drive';
import { syncJobCalendarEvent } from '@/lib/google/calendar';

/**
 * POST /api/admin/jobs/[jobId]/approve
 * Approve a deposit-paid booking for cleaner assignment.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { jobId } = params;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (job.paymentStatus !== PaymentStatus.DEPOSIT_PAID) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only deposit-paid bookings awaiting review can be approved',
          code: 'INVALID_PAYMENT_STATUS',
        },
        { status: 400 }
      );
    }

    if (job.reviewStatus === JobReviewStatus.APPROVED) {
      return NextResponse.json({ success: true, message: 'Booking already approved' });
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        reviewStatus: JobReviewStatus.APPROVED,
        status: job.status === JobStatus.RECEIVED ? JobStatus.CONFIRMED : job.status,
        approvedAt: new Date(),
        approvedById: auth.userId,
      },
    });

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: 'ADMIN',
      action: 'JOB_BOOKING_APPROVED',
      entityType: 'Job',
      entityId: jobId,
      description: `Deposit booking approved for assignment`,
    });

    // Fire-and-forget: this is the "booking confirmed" moment for
    // deposit-mode jobs (full-payment jobs already got this at creation).
    createClientJobFolder({
      id: updated.id,
      jobReference: updated.jobReference,
      customerName: updated.customerName,
    }).catch(() => {});
    syncJobCalendarEvent(updated.id).catch(() => {});

    return NextResponse.json({ success: true, job: updated });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[JOB APPROVE]', error);
    const message = error instanceof Error ? error.message : 'Failed to approve booking';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
