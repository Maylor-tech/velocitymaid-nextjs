import { NextRequest, NextResponse } from 'next/server';
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { assertTransition } from '@/lib/jobStatus';
import { createAdminNotification, adminNotificationHelpers } from '@/lib/notifications/adminNotificationCenter';
import { isDispatchOffersEnabledForBranch } from '@/lib/dispatch/featureFlags';
import { loadOpenOfferForCleaner } from '@/lib/dispatch/jobOffer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/cleaner/jobs/[jobId]/accept
 * Cleaner accepts an assigned job and marks on the way.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    await requireRole(req, 'CLEANER');
    const authResult = await getAuthenticatedCleaner(req);
    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Not authenticated as cleaner' },
        { status: 401 }
      );
    }

    const cleanerId = authResult.cleanerId;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { Branch: { select: { slug: true } } },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (!job.assignedCleanerId) {
      const openOffer = await loadOpenOfferForCleaner(jobId, cleanerId);
      if (openOffer || isDispatchOffersEnabledForBranch(job.Branch?.slug)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Respond to the job offer to accept. This job is not assigned yet.',
            code: 'RESPOND_TO_OFFER',
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Job is not assigned to you' },
        { status: 403 }
      );
    }

    if (job.assignedCleanerId !== cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Job is not assigned to you' },
        { status: 403 }
      );
    }

    if (job.status !== JobStatus.ASSIGNED) {
      return NextResponse.json(
        {
          success: false,
          error: `Job cannot be accepted. Current status: ${job.status}. Must be ASSIGNED.`,
        },
        { status: 400 }
      );
    }

    assertTransition(job.status, JobStatus.ON_THE_WAY);

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.ON_THE_WAY,
        onTheWayAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        onTheWayAt: true,
      },
    });

    await logAuditEntry({
      actorId: cleanerId,
      actorRole: 'CLEANER',
      action: 'JOB_ACCEPTED',
      entityType: 'Job',
      entityId: jobId,
      description: `Cleaner accepted job and is on the way`,
      changes: {
        previousStatus: job.status,
        newStatus: JobStatus.ON_THE_WAY,
      },
    });

    createAdminNotification({
      type: 'CLEANER_ACCEPTED',
      severity: 'INFO',
      message: `Cleaner accepted job ${job.jobReference || jobId} and is on the way`,
      jobId,
      actionUrl: adminNotificationHelpers.adminJobLink(jobId),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: 'Job accepted. You are on the way.',
    });
  } catch (err: unknown) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    console.error('[CLEANER_ACCEPT] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to accept job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
