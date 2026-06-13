import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';
import { JobStatus } from '@prisma/client';
import { requireCleanerJobAssignment } from '@/lib/auth/requireRole';
import { computeBalanceDueAfterCompletion, resolveCompletionPaymentUpdate } from '@/lib/booking/jobPayment';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/cleaner/jobs/[jobId]/complete
 *
 * Cleaner marks a job completed. Deposit-mode jobs move to BALANCE_DUE;
 * payout is created later when the customer pays the remaining balance.
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
        quotedTotal: true,
        totalPrice: true,
        amountPaid: true,
        assignedCleanerId: true,
        customerId: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.assignedCleanerId !== cleanerId) {
      return NextResponse.json({ error: 'Job is not assigned to you' }, { status: 403 });
    }

    if (job.status === JobStatus.COMPLETED) {
      const existing = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          balanceDue: true,
          completedAt: true,
        },
      });
      return NextResponse.json({
        success: true,
        job: {
          ...existing,
          balanceDue: existing?.balanceDue ? Number(existing.balanceDue) : null,
        },
        message: 'Job already completed.',
      });
    }

    if (job.status !== JobStatus.IN_PROGRESS) {
      return NextResponse.json(
        {
          error: `Job cannot be completed. Current status: ${job.status}. Must be IN_PROGRESS.`,
          currentStatus: job.status,
          requiredStatus: 'IN_PROGRESS',
        },
        { status: 400 }
      );
    }

    const payout = await prisma.jobPayout.findUnique({
      where: { jobId },
      select: { status: true },
    });

    const paymentUpdate = resolveCompletionPaymentUpdate(
      job.paymentStatus,
      {
        quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : null,
        totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
        amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
      },
      { payoutStatus: payout?.status ?? null }
    );

    const completionTimestamp = new Date();

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: completionTimestamp,
        ...(paymentUpdate ?? {}),
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        balanceDue: true,
        completedAt: true,
      },
    });

    await logAuditEntry({
      actorId: cleanerId,
      actorRole: 'CLEANER',
      action: 'JOB_COMPLETED',
      entityType: 'Job',
      entityId: jobId,
      description: `Job marked COMPLETED by cleaner ${authResult.cleaner?.name || cleanerId}`,
      changes: {
        previousStatus: job.status,
        newStatus: JobStatus.COMPLETED,
        completedAt: updatedJob.completedAt?.toISOString(),
        paymentStatus: updatedJob.paymentStatus,
        balanceDue: updatedJob.balanceDue ? Number(updatedJob.balanceDue) : null,
      },
    });

    console.log(`[CLEANER] Job ${jobId} completed by cleaner ${cleanerId}`);

    try {
      const { verifyJobCompletion, checkJobCompletionIssues } = await import(
        '@/lib/pilot/dayOfJob'
      );
      const completionCheck = await verifyJobCompletion(jobId);

      if (!completionCheck.passed) {
        console.warn(`[PHASE_M] Job ${jobId} completion check failed:`, completionCheck.issues);
        await checkJobCompletionIssues(jobId);
      } else if (completionCheck.warnings.length > 0) {
        console.warn(`[PHASE_M] Job ${jobId} completion warnings:`, completionCheck.warnings);
      }
    } catch (checkError: unknown) {
      console.error('[PHASE_M] Error running completion checks:', checkError);
    }

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        balanceDue: updatedJob.balanceDue ? Number(updatedJob.balanceDue) : null,
      },
      message: paymentUpdate
        ? 'Job completed. Customer balance is now due before payout.'
        : 'Job completed successfully.',
    });
  } catch (err: unknown) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    console.error('[CLEANER_COMPLETE] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to complete job';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
