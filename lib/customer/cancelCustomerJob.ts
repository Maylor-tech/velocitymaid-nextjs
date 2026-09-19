import { JobOfferStatus, JobStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { DispatchError } from '@/lib/dispatch/errors';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';
import {
  CUSTOMER_CANCELLABLE_STATUSES,
  isCancelledStatus,
  isCustomerCancellableStatus,
} from '@/lib/jobStatus';
import {
  cancelOpenOfferedRowsInTx,
  clearCurrentAssignmentInTx,
} from '@/lib/dispatch/clearAssignmentInTx';
import { notifyCleanerOfJobCancellation } from '@/lib/notifications/cleanerCancellationEmail';

const IN_SERVICE_STATUSES: JobStatus[] = [
  JobStatus.ON_THE_WAY,
  JobStatus.IN_PROGRESS,
  JobStatus.AWAITING_QC,
];

const MIN_HOURS_BEFORE_JOB = 2;

export type CancelCustomerJobResult = {
  job: {
    id: string;
    status: JobStatus;
    assignedCleanerId: string | null;
    assignedAt: Date | null;
    cancellationReason: string | null;
    cancelledAt: Date | null;
    preferredDate: Date | null;
    paymentStatus: string;
    quotedTotal: number | null;
    totalPrice: number | null;
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

/**
 * Atomic customer cancellation.
 *
 * ASSIGNED → CANCELLED clears current cleaner responsibility in the same
 * transaction (never release-to-CONFIRMED then cancel). Historical ACCEPTED
 * JobOffer + compensation snapshots are preserved. Outstanding OFFERED rows
 * are cancelled so they cannot later assign the dead job.
 */
export async function cancelCustomerJob(input: {
  jobId: string;
  customerId: string;
  reason?: string | null;
}): Promise<CancelCustomerJobResult> {
  const reason =
    typeof input.reason === 'string' && input.reason.trim()
      ? input.reason.trim()
      : null;

  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    select: {
      id: true,
      customerId: true,
      status: true,
      assignedCleanerId: true,
      assignedAt: true,
      startedAt: true,
      preferredDate: true,
      branchId: true,
      paymentStatus: true,
      quotedTotal: true,
      totalPrice: true,
      operationalTotal: true,
      jobReference: true,
      cancellationReason: true,
      cancelledAt: true,
    },
  });

  if (!job) {
    throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);
  }

  if (job.customerId !== input.customerId) {
    throw new DispatchError('Unauthorized', 'UNAUTHORIZED', 403);
  }

  if (job.status === JobStatus.COMPLETED) {
    throw new DispatchError(
      'Cannot cancel a completed or already cancelled job',
      'JOB_COMPLETED',
      400
    );
  }

  if (isCancelledStatus(job.status)) {
    throw new DispatchError(
      'Cannot cancel a completed or already cancelled job',
      'JOB_CANCELLED',
      400
    );
  }

  if (IN_SERVICE_STATUSES.includes(job.status) || job.startedAt) {
    throw new DispatchError(
      'Job must be scheduled to cancel',
      'JOB_IN_PROGRESS',
      400
    );
  }

  if (!isCustomerCancellableStatus(job.status)) {
    throw new DispatchError(
      'Job must be scheduled to cancel',
      'INVALID_STATUS',
      400
    );
  }

  if (!job.preferredDate) {
    throw new DispatchError(
      'Job does not have a scheduled date',
      'MISSING_DATE',
      400
    );
  }

  const now = new Date();
  const hoursUntilJob =
    (new Date(job.preferredDate).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilJob <= MIN_HOURS_BEFORE_JOB) {
    throw new DispatchError(
      'Cancellation window closed. Cancellations must be made at least 2 hours before your appointment.',
      'CANCEL_WINDOW_CLOSED',
      400
    );
  }

  if (job.assignedCleanerId) {
    const payout = await prisma.jobPayout.findUnique({
      where: { jobId: job.id },
      select: { id: true },
    });
    if (payout) {
      throw new DispatchError(
        'A cleaner payout already exists for this job. Cancellation is blocked.',
        'PAYOUT_EXISTS',
        409
      );
    }
  }

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

  const quotedTotalUnchanged =
    job.quotedTotal != null ? Number(job.quotedTotal) : null;
  const totalPriceUnchanged =
    job.totalPrice != null ? Number(job.totalPrice) : null;
  const releasedCleanerId = job.assignedCleanerId;

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
        nextStatus: JobStatus.CANCELLED,
        branchId: job.branchId,
        jobReference: job.jobReference,
        acceptedOffer,
        actorId: input.customerId,
        actorRole: 'CUSTOMER',
        reasonLabel: 'Customer cancelled service',
        reasonCode: 'CUSTOMER_CANCELLED',
        notes: reason,
        now,
        extraJobData: {
          cancellationReason: reason,
          cancelledAt: now,
        },
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
          status: { in: CUSTOMER_CANCELLABLE_STATUSES },
          assignedCleanerId: null,
        },
        data: {
          status: JobStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: now,
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

    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        actorId: input.customerId,
        actorRole: 'CUSTOMER',
        action: 'JOB_CANCELLED_BY_CUSTOMER',
        entityType: 'Job',
        entityId: job.id,
        description: `Customer cancelled ${job.jobReference || job.id}`,
        changes: {
          previousStatus: job.status,
          newStatus: JobStatus.CANCELLED,
          reason,
          releasedCleanerId,
          cancelledOpenOfferCount,
          acceptedOfferId: acceptedOffer?.id ?? null,
          acceptedOfferStatusUnchanged: acceptedOffer?.status ?? null,
          paymentStatusUnchanged: nextJob.paymentStatus,
          quotedTotalUnchanged,
          totalPriceUnchanged,
        },
      },
    });

    return { nextJob, cancelledOpenOfferCount };
  });

  // Calendar cancel only — never sync/recreate after a terminal cancel.
  await awaitJobCalendarCancel(job.id);

  // Email is best-effort and must never undo cancellation. Use the
  // pre-clear releasedCleanerId — Job.assignedCleanerId is already null.
  if (releasedCleanerId) {
    await notifyCleanerOfJobCancellation({
      jobId: job.id,
      cleanerId: releasedCleanerId,
      triggeredBy: 'system',
    }).catch(() => {});
  }

  return {
    job: {
      id: updated.nextJob.id,
      status: updated.nextJob.status,
      assignedCleanerId: updated.nextJob.assignedCleanerId,
      assignedAt: updated.nextJob.assignedAt,
      cancellationReason: updated.nextJob.cancellationReason,
      cancelledAt: updated.nextJob.cancelledAt,
      preferredDate: job.preferredDate,
      paymentStatus: updated.nextJob.paymentStatus,
      quotedTotal:
        updated.nextJob.quotedTotal != null
          ? Number(updated.nextJob.quotedTotal)
          : null,
      totalPrice:
        updated.nextJob.totalPrice != null
          ? Number(updated.nextJob.totalPrice)
          : null,
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
