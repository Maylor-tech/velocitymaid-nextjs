import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';
import { JobStatus } from '@prisma/client';
import { requireCleanerJobAssignment } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { computeCleanDurationMins } from '@/lib/dispatch/duration';
import {
  createAdminNotification,
  adminNotificationHelpers,
} from '@/lib/notifications/adminNotificationCenter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/cleaner/jobs/[jobId]/complete
 *
 * Cleaner submits the job for admin QC. Does not invoice, does not email the
 * customer a completion notice, and never changes paymentStatus (including
 * INVOICE_AFTER_SERVICE jobs, which must remain PENDING until ops bills).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    await requireCleanerJobAssignment(req, jobId);
    const authResult = await getAuthenticatedCleaner(req);
    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { error: authResult.error || 'Not authenticated as cleaner' },
        { status: 401 }
      );
    }

    const cleanerId = authResult.cleanerId;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        billingPolicy: true,
        assignedCleanerId: true,
        startedAt: true,
        completedAt: true,
        cleanDurationMins: true,
        jobReference: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.assignedCleanerId !== cleanerId) {
      return NextResponse.json({ error: 'Job is not assigned to you' }, { status: 403 });
    }

    if (job.status === JobStatus.COMPLETED) {
      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          paymentStatus: job.paymentStatus,
          completedAt: job.completedAt,
          startedAt: job.startedAt,
          cleanDurationMins: job.cleanDurationMins,
        },
        submittedForQc: true,
        message: 'Already submitted for QC. Admin still reviews completion and billing.',
      });
    }

    if (job.status !== JobStatus.IN_PROGRESS) {
      return NextResponse.json(
        {
          error: `Job cannot be finished. Current status: ${job.status}. Must be IN_PROGRESS.`,
          currentStatus: job.status,
          requiredStatus: 'IN_PROGRESS',
        },
        { status: 400 }
      );
    }

    const completionTimestamp = new Date();
    const cleanDurationMins = computeCleanDurationMins({
      startedAt: job.startedAt,
      completedAt: completionTimestamp,
      existingMins: job.cleanDurationMins,
    });

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: completionTimestamp,
        completedBy: cleanerId,
        ...(cleanDurationMins != null ? { cleanDurationMins } : {}),
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        billingPolicy: true,
        completedAt: true,
        startedAt: true,
        cleanDurationMins: true,
      },
    });

    if (updatedJob.paymentStatus !== job.paymentStatus) {
      return NextResponse.json(
        { error: 'Finish Job must not change payment status' },
        { status: 500 }
      );
    }

    await logAuditEntry({
      actorId: cleanerId,
      actorRole: 'CLEANER',
      action: 'JOB_SUBMITTED_FOR_QC',
      entityType: 'Job',
      entityId: jobId,
      description: `Cleaner submitted job for QC (not invoiced)`,
      changes: {
        previousStatus: job.status,
        newStatus: JobStatus.COMPLETED,
        completedAt: updatedJob.completedAt?.toISOString(),
        startedAt: updatedJob.startedAt?.toISOString() ?? null,
        cleanDurationMins: updatedJob.cleanDurationMins,
        paymentStatusUnchanged: updatedJob.paymentStatus,
        billingPolicy: updatedJob.billingPolicy,
      },
    });

    createAdminNotification({
      type: 'JOB_COMPLETED',
      severity: 'INFO',
      message: `${job.jobReference || jobId} submitted for QC — review before invoicing`,
      jobId,
      actionUrl: adminNotificationHelpers.adminJobLink(jobId),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      submittedForQc: true,
      job: {
        ...updatedJob,
      },
      message:
        'Submitted for QC. Admin reviews photos and checklist before invoicing or notifying the customer.',
    });
  } catch (err: unknown) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    console.error('[CLEANER_COMPLETE] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to finish job';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
