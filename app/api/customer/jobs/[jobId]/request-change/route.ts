import { NextRequest, NextResponse } from 'next/server';
import { readCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { notifyAdmin } from '@/lib/notifyAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/customer/jobs/[jobId]/request-change
 * 
 * Request a change to a scheduled job
 * 
 * Body: {
 *   newDate?: string (ISO date),
 *   newStartTime?: string,
 *   newDuration?: number,
 *   newAddress?: string,
 *   notes?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await readCustomerSession();

    if (!session || !session.customerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate jobId
    if (!params.jobId || typeof params.jobId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

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
    if (job.status === 'completed' || job.status === 'cancelled' || job.status === 'CANCELLED_BY_CUSTOMER') {
      return NextResponse.json(
        { success: false, error: 'Cannot change a completed or cancelled job' },
        { status: 400 }
      );
    }

    // Only allow change request if status is "SCHEDULED" or "scheduled" or "pending"
    const allowedStatuses = ['SCHEDULED', 'scheduled', 'pending', 'assigned'];
    if (!allowedStatuses.includes(job.status)) {
      return NextResponse.json(
        { success: false, error: 'Job must be scheduled to request changes' },
        { status: 400 }
      );
    }

    // Check if job date is more than 4 hours away
    if (!job.preferredDate) {
      return NextResponse.json(
        { success: false, error: 'Job does not have a scheduled date' },
        { status: 400 }
      );
    }

    const now = new Date();
    const jobDate = new Date(job.preferredDate);
    const hoursUntilJob = (jobDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilJob <= 4) {
      return NextResponse.json(
        { success: false, error: 'Change window closed. Changes must be requested at least 4 hours before your appointment.' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { newDate, newStartTime, newDuration, newAddress, notes } = body ?? {};

    // Build payload
    const payload = {
      newDate: newDate || null,
      newStartTime: newStartTime || null,
      newDuration: newDuration || null,
      newAddress: newAddress || null,
      notes: notes || null,
      originalDate: job.preferredDate?.toISOString() || null,
      originalTime: job.preferredTime || null,
      originalAddress: job.address || job.serviceLocation || null,
    };

    // Create change request
    const changeRequest = await prisma.customerJobChangeRequest.create({
      data: {
        jobId: params.jobId,
        customerId: session.customerId,
        payload,
        status: 'PENDING',
      },
    });

    // Notify admin
    notifyAdmin('JOB_CHANGE_REQUEST', {
      jobId: params.jobId,
      customerId: session.customerId,
      customerName: job.Customer
        ? `${job.Customer.firstName} ${job.Customer.lastName}`
        : undefined,
      jobDate: job.preferredDate?.toISOString(),
      changeRequestId: changeRequest.id,
      requestedChanges: payload,
    });

    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted and our team will review it.',
    });
  } catch (error: any) {
    console.error('Request change error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit change request',
      },
      { status: 500 }
    );
  }
}















