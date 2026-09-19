/**
 * Admin terminal cancellation with atomic assignment clear.
 *
 * Transitions a job to CANCELLED / CANCELLED_EMERGENCY while clearing
 * assignedCleanerId, assignedAt, and JobTeamMember rows in the same
 * transaction when a cleaner was assigned. Preserves ACCEPTED JobOffer
 * history and compensation snapshots.
 */
import { JobOfferStatus, JobStatus, type Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { DispatchError } from '@/lib/dispatch/errors';
import {
  cancelOpenOfferedRowsInTx,
  clearCurrentAssignmentInTx,
} from '@/lib/dispatch/clearAssignmentInTx';

export type AdminTerminalCancelStatus =
  | typeof JobStatus.CANCELLED
  | typeof JobStatus.CANCELLED_EMERGENCY;

export type ApplyAdminTerminalCancellationResult = {
  job: {
    id: string;
    status: JobStatus;
    assignedCleanerId: string | null;
    assignedAt: Date | null;
    paymentStatus: string;
    quotedTotal: number | null;
    totalPrice: number | null;
    cancellationReason: string | null;
    cancelledAt: Date | null;
  };
  releasedCleanerId: string | null;
  cancelledOpenOfferCount: number;
  acceptedOffer: {
    id: string;
    status: string;
    compensationAmount: number;
    compensationBasis: string;
  } | null;
};

export async function applyAdminTerminalCancellation(input: {
  jobId: string;
  adminId: string | null;
  nextStatus: AdminTerminalCancelStatus;
  reasonLabel: string;
  reasonCode: string;
  notes?: string | null;
  /** Extra Job fields applied in the same terminal update (e.g. reviewStatus). */
  extraJobData?: Prisma.JobUncheckedUpdateManyInput;
  /** Additional non-status/assignment fields when the job is unassigned. */
  unassignedUpdateData?: Prisma.JobUncheckedUpdateManyInput;
  auditAction?: string;
  auditDescription?: string;
}): Promise<ApplyAdminTerminalCancellationResult> {
  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    select: {
      id: true,
      status: true,
      assignedCleanerId: true,
      assignedAt: true,
      branchId: true,
      jobReference: true,
      paymentStatus: true,
      quotedTotal: true,
      totalPrice: true,
    },
  });
  if (!job) {
    throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);
  }

  if (
    job.status === JobStatus.CANCELLED ||
    job.status === JobStatus.CANCELLED_EMERGENCY
  ) {
    throw new DispatchError('Job is already cancelled', 'JOB_ALREADY_CANCELLED', 400);
  }

  // COMPLETED is terminal service history — ordinary cancel must not rewrite it.
  if (job.status === JobStatus.COMPLETED) {
    throw new DispatchError(
      'Cannot cancel a completed job',
      'JOB_COMPLETED',
      400
    );
  }

  const now = new Date();
  const releasedCleanerId = job.assignedCleanerId;
  const quotedTotalUnchanged =
    job.quotedTotal != null ? Number(job.quotedTotal) : null;
  const totalPriceUnchanged =
    job.totalPrice != null ? Number(job.totalPrice) : null;

  const acceptedOffer = job.assignedCleanerId
    ? await prisma.jobOffer.findFirst({
        where: {
          jobId: job.id,
          cleanerId: job.assignedCleanerId,
          status: JobOfferStatus.ACCEPTED,
        },
        orderBy: { respondedAt: 'desc' },
      })
    : null;

  const adminId =
    input.adminId && input.adminId !== 'local-admin' ? input.adminId : null;

  const updated = await prisma.$transaction(async (tx) => {
    let nextJob: {
      id: string;
      status: JobStatus;
      assignedCleanerId: string | null;
      assignedAt: Date | null;
      paymentStatus: string;
      quotedTotal: number | { toString(): string } | null;
      totalPrice: number | { toString(): string } | null;
      cancellationReason: string | null;
      cancelledAt: Date | null;
    };

    if (job.assignedCleanerId) {
      const cleared = await clearCurrentAssignmentInTx(tx, {
        jobId: job.id,
        expectedCleanerId: job.assignedCleanerId,
        previousStatus: job.status,
        nextStatus: input.nextStatus,
        branchId: job.branchId,
        jobReference: job.jobReference,
        acceptedOffer,
        actorId: adminId,
        actorRole: 'ADMIN',
        reasonLabel: input.reasonLabel,
        reasonCode: input.reasonCode,
        notes: input.notes ?? null,
        now,
        extraJobData: input.extraJobData,
        paymentStatusUnchanged: job.paymentStatus,
        quotedTotalUnchanged,
        totalPriceUnchanged,
      });
      nextJob = {
        id: cleared.id,
        status: cleared.status,
        assignedCleanerId: cleared.assignedCleanerId,
        assignedAt: cleared.assignedAt,
        paymentStatus: cleared.paymentStatus,
        quotedTotal: cleared.quotedTotal,
        totalPrice: cleared.totalPrice,
        cancellationReason: cleared.cancellationReason,
        cancelledAt: cleared.cancelledAt,
      };
    } else {
      const moved = await tx.job.updateMany({
        where: {
          id: job.id,
          status: { notIn: [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY] },
          assignedCleanerId: null,
        },
        data: {
          status: input.nextStatus,
          ...(input.extraJobData ?? {}),
          ...(input.unassignedUpdateData ?? {}),
        },
      });
      if (moved.count !== 1) {
        throw new DispatchError(
          'Job changed before cancellation could complete',
          'CONCURRENT_STATUS_CHANGE',
          409
        );
      }
      const found = await tx.job.findUnique({
        where: { id: job.id },
        select: {
          id: true,
          status: true,
          assignedCleanerId: true,
          assignedAt: true,
          paymentStatus: true,
          quotedTotal: true,
          totalPrice: true,
          cancellationReason: true,
          cancelledAt: true,
        },
      });
      if (!found) {
        throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);
      }
      nextJob = found;
    }

    const cancelledOpenOfferCount = await cancelOpenOfferedRowsInTx(
      tx,
      job.id,
      now
    );

    if (input.auditAction) {
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          actorId: adminId,
          actorRole: 'ADMIN',
          action: input.auditAction,
          entityType: 'Job',
          entityId: job.id,
          description:
            input.auditDescription ||
            `Admin cancelled ${job.jobReference || job.id}`,
          changes: {
            previousStatus: job.status,
            newStatus: input.nextStatus,
            releasedCleanerId,
            cancelledOpenOfferCount,
            acceptedOfferId: acceptedOffer?.id ?? null,
            acceptedOfferStatusUnchanged: acceptedOffer?.status ?? null,
            paymentStatusUnchanged: nextJob.paymentStatus,
            quotedTotalUnchanged,
            totalPriceUnchanged,
            reasonCode: input.reasonCode,
            notes: input.notes ?? null,
          },
        },
      });
    }

    return { nextJob, cancelledOpenOfferCount };
  });

  return {
    job: {
      id: updated.nextJob.id,
      status: updated.nextJob.status,
      assignedCleanerId: updated.nextJob.assignedCleanerId,
      assignedAt: updated.nextJob.assignedAt,
      paymentStatus: updated.nextJob.paymentStatus,
      quotedTotal:
        updated.nextJob.quotedTotal != null
          ? Number(updated.nextJob.quotedTotal)
          : null,
      totalPrice:
        updated.nextJob.totalPrice != null
          ? Number(updated.nextJob.totalPrice)
          : null,
      cancellationReason: updated.nextJob.cancellationReason,
      cancelledAt: updated.nextJob.cancelledAt,
    },
    releasedCleanerId,
    cancelledOpenOfferCount: updated.cancelledOpenOfferCount,
    acceptedOffer: acceptedOffer
      ? {
          id: acceptedOffer.id,
          status: acceptedOffer.status,
          compensationAmount: Number(acceptedOffer.compensationAmount),
          compensationBasis: acceptedOffer.compensationBasis,
        }
      : null,
  };
}
