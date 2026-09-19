import { JobOfferStatus, JobStatus, type Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DispatchError } from '@/lib/dispatch/errors';
import {
  ASSIGNMENT_RELEASED,
  JOB_ASSIGNMENT_RELEASED,
} from '@/lib/dispatch/releaseReasons';

type AcceptedOfferSnapshot = {
  id: string;
  status: JobOfferStatus;
  compensationAmount: Prisma.Decimal | number;
  compensationBasis: string;
} | null;

/**
 * Clear current cleaner responsibility inside an open transaction.
 * Preserves historical ACCEPTED JobOffer rows. Does not touch payouts.
 */
export async function clearCurrentAssignmentInTx(
  tx: Prisma.TransactionClient,
  input: {
    jobId: string;
    expectedCleanerId: string;
    previousStatus: JobStatus;
    nextStatus: JobStatus;
    branchId: string | null;
    jobReference: string | null;
    acceptedOffer: AcceptedOfferSnapshot;
    actorId: string | null;
    actorRole: 'ADMIN' | 'CUSTOMER';
    reasonLabel: string;
    reasonCode: string;
    notes: string | null;
    now: Date;
    /** Extra Job fields applied in the same updateMany (e.g. cancellation). */
    extraJobData?: Prisma.JobUncheckedUpdateManyInput;
    paymentStatusUnchanged: string;
    quotedTotalUnchanged: number | null;
    totalPriceUnchanged: number | null;
  }
): Promise<{
  id: string;
  status: JobStatus;
  assignedCleanerId: string | null;
  assignedAt: Date | null;
  paymentStatus: string;
  quotedTotal: Prisma.Decimal | number | null;
  totalPrice: Prisma.Decimal | number | null;
  operationalTotal: Prisma.Decimal | number | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
}> {
  const moved = await tx.job.updateMany({
    where: {
      id: input.jobId,
      assignedCleanerId: input.expectedCleanerId,
    },
    data: {
      assignedCleanerId: null,
      assignedAt: null,
      status: input.nextStatus,
      ...(input.extraJobData ?? {}),
    },
  });
  if (moved.count !== 1) {
    throw new DispatchError(
      'Assignment changed before release could complete',
      'CONCURRENT_ASSIGNMENT_CHANGE',
      409
    );
  }

  const next = await tx.job.findUnique({
    where: { id: input.jobId },
    select: {
      id: true,
      status: true,
      assignedCleanerId: true,
      assignedAt: true,
      paymentStatus: true,
      quotedTotal: true,
      totalPrice: true,
      operationalTotal: true,
      cancellationReason: true,
      cancelledAt: true,
    },
  });
  if (!next) {
    throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);
  }

  await tx.jobTeamMember.deleteMany({ where: { jobId: input.jobId } });

  await tx.assignmentLog.create({
    data: {
      jobId: input.jobId,
      cleanerId: input.expectedCleanerId,
      branchId: input.branchId,
      outcome: ASSIGNMENT_RELEASED,
      reason: input.reasonLabel,
      details: {
        reasonCode: input.reasonCode,
        notes: input.notes,
        offerId: input.acceptedOffer?.id ?? null,
        previousStatus: input.previousStatus,
        newStatus: next.status,
        releasedAt: input.now.toISOString(),
        releasedByRole: input.actorRole,
        releasedByActorId: input.actorId,
        compensationAmount: input.acceptedOffer
          ? Number(input.acceptedOffer.compensationAmount)
          : null,
        compensationBasis: input.acceptedOffer?.compensationBasis ?? null,
        paymentStatusUnchanged: input.paymentStatusUnchanged,
        quotedTotalUnchanged: input.quotedTotalUnchanged,
        totalPriceUnchanged: input.totalPriceUnchanged,
        acceptedOfferPreserved: true,
      },
    },
  });

  await tx.auditLog.create({
    data: {
      id: randomUUID(),
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: JOB_ASSIGNMENT_RELEASED,
      entityType: 'Job',
      entityId: input.jobId,
      description: `Cleaner released from ${input.jobReference || input.jobId}. Accepted offer preserved.`,
      changes: {
        from: input.expectedCleanerId,
        to: null,
        offerId: input.acceptedOffer?.id ?? null,
        offerStatusUnchanged: input.acceptedOffer?.status ?? null,
        reason: input.reasonCode,
        notes: input.notes,
        nextStatus: input.nextStatus,
        paymentStatusUnchanged: input.paymentStatusUnchanged,
      },
    },
  });

  return next;
}

/** Mark outstanding unaccepted offers cancelled so they cannot assign a dead job. */
export async function cancelOpenOfferedRowsInTx(
  tx: Prisma.TransactionClient,
  jobId: string,
  now: Date
): Promise<number> {
  const result = await tx.jobOffer.updateMany({
    where: {
      jobId,
      status: JobOfferStatus.OFFERED,
    },
    data: {
      status: JobOfferStatus.CANCELLED,
      cancelledAt: now,
    },
  });
  return result.count;
}
