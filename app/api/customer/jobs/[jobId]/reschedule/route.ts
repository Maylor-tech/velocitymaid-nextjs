export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { JobStatus } from '@prisma/client';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';

/**
 * POST /api/customer/jobs/[jobId]/reschedule
 * 
 * Request to reschedule a job
 * 
 * Body: { newDate: string (ISO), timeWindow?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCustomerJobOwnership(request, params.jobId);
    const session = await getCustomerSession();
    if (!session) throw new Error("Session not found after auth");

    const body = await request.json();
    const { newDate, timeWindow } = body;

    if (!newDate) {
      return NextResponse.json(
        { success: false, error: 'newDate is required' },
        { status: 400 }
      );
    }

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
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

    // Check if job can be rescheduled
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: 'Cannot reschedule a completed or cancelled job' },
        { status: 400 }
      );
    }

    // Update job with reschedule request
    // We'll store the requested date/time and set a status flag
    const requestedDate = new Date(newDate);

    await prisma.job.update({
      where: { id: params.jobId },
      data: {
        preferredDate: requestedDate,
        preferredTime: timeWindow || job.preferredTime,
        status: JobStatus.CONFIRMED, // Keep as CONFIRMED, reschedule handled via date change
      },
    });

    // Log audit entry
    await logAuditEntry({
      actorId: session.customerId,
      actorRole: 'CUSTOMER',
      action: 'JOB_RESCHEDULE_REQUEST',
      entityType: 'Job',
      entityId: params.jobId,
      description: `Customer requested to reschedule job to ${newDate}`,
      changes: {
        oldDate: job.preferredDate?.toISOString(),
        newDate: requestedDate.toISOString(),
        oldTime: job.preferredTime,
        newTime: timeWindow || job.preferredTime,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reschedule request submitted successfully',
    });
  } catch (error: any) {
    console.error('Reschedule job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reschedule job',
      },
      { status: 500 }
    );
  }
}


