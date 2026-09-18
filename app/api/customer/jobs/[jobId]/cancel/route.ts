import { NextRequest, NextResponse } from 'next/server';
import { readCustomerSession } from '@/lib/customerSession';
import { notifyAdmin } from '@/lib/notifyAdmin';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';
import { cancelCustomerJob } from '@/lib/customer/cancelCustomerJob';
import { isDispatchError } from '@/lib/dispatch/errors';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/customer/jobs/[jobId]/cancel
 *
 * Cancel a pre-service job (RECEIVED | CONFIRMED | ASSIGNED).
 * ASSIGNED cancellations release current cleaner responsibility atomically
 * while preserving the historical ACCEPTED JobOffer.
 *
 * Body: { reason?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireCustomerJobOwnership(request, params.jobId);
    const session = await readCustomerSession();
    if (!session) throw new Error('Session not found after auth');

    if (!params.jobId || typeof params.jobId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason =
      body && typeof body === 'object' && 'reason' in body
        ? (body as { reason?: unknown }).reason
        : undefined;

    const result = await cancelCustomerJob({
      jobId: params.jobId,
      customerId: session.customerId,
      reason: typeof reason === 'string' ? reason : null,
    });

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { firstName: true, lastName: true },
    });

    notifyAdmin('JOB_CANCELLED_BY_CUSTOMER', {
      jobId: params.jobId,
      customerId: session.customerId,
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : undefined,
      jobDate: result.job.preferredDate?.toISOString(),
      reason: result.job.cancellationReason || undefined,
      releasedCleanerId: result.releasedCleanerId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Your appointment has been cancelled.',
      job: {
        id: result.job.id,
        status: result.job.status,
        assignedCleanerId: result.job.assignedCleanerId,
      },
    });
  } catch (error: unknown) {
    if (isDispatchError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Cancel job error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to cancel job',
      },
      { status: 500 }
    );
  }
}
