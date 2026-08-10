import { NextRequest, NextResponse } from 'next/server';
import { readCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { notifyAdmin } from '@/lib/notifyAdmin';
import { JobStatus } from '@prisma/client';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/customer/jobs/[jobId]/cancel
 * 
 * Cancel a scheduled job
 * 
 * Body: { reason?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCustomerJobOwnership(request, params.jobId);
    const session = await readCustomerSession();
    if (!session) throw new Error("Session not found after auth");

    // Validate jobId
    if (!params.jobId || typeof params.jobId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason } = body ?? {};

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to customer
    if (job.customerId !== session.customerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if job is already cancelled or completed
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED || job.status === JobStatus.CANCELLED_EMERGENCY) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a completed or already cancelled job' },
        { status: 400 }
      );
    }

    // Only allow cancellation if status is "SCHEDULED" or "scheduled" or "pending"
    const allowedStatuses = ['SCHEDULED', 'scheduled', 'pending', 'assigned'];
    if (!allowedStatuses.includes(job.status)) {
      return NextResponse.json(
        { success: false, error: 'Job must be scheduled to cancel' },
        { status: 400 }
      );
    }

    // Check if job date is more than 2 hours away
    if (!job.preferredDate) {
      return NextResponse.json(
        { success: false, error: 'Job does not have a scheduled date' },
        { status: 400 }
      );
    }

    const now = new Date();
    const jobDate = new Date(job.preferredDate);
    const hoursUntilJob = (jobDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilJob <= 2) {
      return NextResponse.json(
        { success: false, error: 'Cancellation window closed. Cancellations must be made at least 2 hours before your appointment.' },
        { status: 400 }
      );
    }

    // Update job status
    await prisma.job.update({
      where: { id: params.jobId },
      data: {
        status: JobStatus.CANCELLED,
        cancellationReason: reason || null,
        cancelledAt: new Date(),
      },
    });

    // Await Calendar cancel in this request — Job cancel already committed.
    await awaitJobCalendarCancel(params.jobId);

    // Notify admin
    notifyAdmin('JOB_CANCELLED_BY_CUSTOMER', {
      jobId: params.jobId,
      customerId: session.customerId,
      customerName: job.Customer
        ? `${job.Customer.firstName} ${job.Customer.lastName}`
        : undefined,
      jobDate: job.preferredDate?.toISOString(),
      reason: reason || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Your appointment has been cancelled.',
    });
  } catch (error: any) {
    console.error('Cancel job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cancel job',
      },
      { status: 500 }
    );
  }
}
