import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';
import { requireCleanerJobAssignment } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { submitJobForQc } from '@/lib/jobs/submitJobForQc';
import { loadJobPhotoChecklist } from '@/lib/photos/jobPhotoChecklist';
import { finishPhotoBlockMessage } from '@/lib/photos/propertyPhotoSlots';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/cleaner/jobs/[jobId]/complete
 *
 * Cleaner Finish → AWAITING_QC (Submitted for QC).
 * Blocks when arrival or required AFTER slots are missing.
 * Admin override lives on the admin photo-review route, not here.
 * Does not set COMPLETED, does not set completedAt, does not invoice,
 * does not email the customer, and never changes paymentStatus.
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

    const assigned = await prisma.job.findUnique({
      where: { id: jobId },
      select: { assignedCleanerId: true, status: true },
    });
    if (!assigned) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (assigned.assignedCleanerId !== authResult.cleanerId) {
      return NextResponse.json({ error: 'Job is not assigned to you' }, { status: 403 });
    }

    if (assigned.status === 'IN_PROGRESS') {
      const checklist = await loadJobPhotoChecklist(jobId);
      if (checklist && !checklist.finish.ok) {
        return NextResponse.json(
          {
            error: finishPhotoBlockMessage(checklist.finish),
            missingAfter: checklist.finish.missingAfter,
            needsArrival: checklist.finish.needsArrival,
            issuesNeedBefore: checklist.finish.issuesNeedBefore,
          },
          { status: 400 }
        );
      }
    }

    const result = await submitJobForQc({
      jobId,
      actorId: authResult.cleanerId,
      actorRole: 'CLEANER',
    });

    if (result.kind === 'missing') {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (result.kind === 'not-in-progress') {
      return NextResponse.json(
        {
          error: `Job cannot be finished. Current status: ${result.status}. Must be IN_PROGRESS.`,
          currentStatus: result.status,
          requiredStatus: 'IN_PROGRESS',
        },
        { status: 400 }
      );
    }
    if (result.kind === 'already') {
      return NextResponse.json({
        success: true,
        job: result.job,
        submittedForQc: true,
        message: result.message,
      });
    }
    if (result.kind === 'payment-changed') {
      return NextResponse.json(
        { error: 'Finish Job must not change payment status' },
        { status: 500 }
      );
    }
    if (result.kind === 'completed-forbidden') {
      return NextResponse.json(
        { error: 'Finish Job must not mark the job COMPLETED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submittedForQc: true,
      job: result.job,
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
