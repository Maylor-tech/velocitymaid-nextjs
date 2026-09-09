import { JobStatus, JobOfferStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { DispatchError } from '@/lib/dispatch/errors';
import { awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';
import {
  ASSIGNMENT_RELEASED,
  JOB_ASSIGNMENT_RELEASED,
  isReleaseReasonCode,
  releaseReasonLabel,
  type ReleaseReasonCode,
} from '@/lib/dispatch/releaseReasons';

const TERMINAL_STATUSES: JobStatus[] = [
  JobStatus.COMPLETED,
  JobStatus.CANCELLED,
  JobStatus.CANCELLED_EMERGENCY,
];

const IN_SERVICE_STATUSES: JobStatus[] = [
  JobStatus.ON_THE_WAY,
  JobStatus.IN_PROGRESS,
  JobStatus.AWAITING_QC,
];

export type ReleaseAssignmentResult = {
  job: {
    id: string;
    status: JobStatus;
    assignedCleanerId: string | null;
    paymentStatus: string;
    quotedTotal: number | null;
    totalPrice: number | null;
    operationalTotal: number | null;
  };
  offer: {
    id: string;
    status: string;
    cleanerId: string;
    compensationAmount: number;
    compensationBasis: string;
    offeredAt: Date;
    expiresAt: Date;
  } | null;
  release: {
    reason: ReleaseReasonCode;
    notes: string | null;
  };
};

/**
 * Admin recovery: clear current assignment without rewriting the accepted JobOffer.
 * Current responsibility is Job.assignedCleanerId. Historical accept stays ACCEPTED.
 */
export async function releaseAssignedCleaner(input: {
  jobId: string;
  expectedCleanerId?: string | null;
  reason: unknown;
  notes?: string | null;
  adminId?: string | null;
}): Promise<ReleaseAssignmentResult> {
  if (!isReleaseReasonCode(input.reason)) {
    throw new DispatchError('A valid release reason is required', 'INVALID_RELEASE_REASON', 400);
  }
  const reason = input.reason;
  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  if (reason === 'OTHER' && notes.length < 3) {
    throw new DispatchError(
      'Notes are required when the release reason is Other',
      'RELEASE_NOTES_REQUIRED',
      400
    );
  }

  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    select: {
      id: true,
      status: true,
      assignedCleanerId: true,
      assignedAt: true,
      startedAt: true,
      branchId: true,
      paymentStatus: true,
      quotedTotal: true,
      totalPrice: true,
      operationalTotal: true,
      jobReference: true,
    },
  });
  if (!job) throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);

  if (!job.assignedCleanerId) {
    throw new DispatchError('Job is not assigned to a cleaner', 'NOT_ASSIGNED', 409);
  }

  if (input.expectedCleanerId && input.expectedCleanerId !== job.assignedCleanerId) {
    throw new DispatchError(
      'Job is not assigned to the expected cleaner',
      'CLEANER_MISMATCH',
      409
    );
  }

  if (job.status === JobStatus.COMPLETED) {
    throw new DispatchError('Completed jobs cannot be released', 'JOB_COMPLETED', 409);
  }
  if (
    job.status === JobStatus.CANCELLED ||
    job.status === JobStatus.CANCELLED_EMERGENCY
  ) {
    throw new DispatchError('Cancelled jobs cannot be released', 'JOB_CANCELLED', 409);
  }
  if (IN_SERVICE_STATUSES.includes(job.status) || job.startedAt) {
    throw new DispatchError(
      'Jobs already in service cannot be released from this action',
      'JOB_IN_PROGRESS',
      409
    );
  }
  if (TERMINAL_STATUSES.includes(job.status)) {
    throw new DispatchError(
      `Job status ${job.status} does not allow release`,
      'INVALID_STATUS',
      409
    );
  }

  const acceptedOffer = await prisma.jobOffer.findFirst({
    where: {
      jobId: job.id,
      cleanerId: job.assignedCleanerId,
      status: JobOfferStatus.ACCEPTED,
    },
    orderBy: { respondedAt: 'desc' },
  });

  const payout = await prisma.jobPayout.findUnique({
    where: { jobId: job.id },
    select: { id: true },
  });
  if (payout) {
    throw new DispatchError(
      'A cleaner payout already exists for this job. Release is blocked.',
      'PAYOUT_EXISTS',
      409
    );
  }

  const expectedCleanerId = job.assignedCleanerId;
  const adminId =
    input.adminId && input.adminId !== 'local-admin' ? input.adminId : null;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const moved = await tx.job.updateMany({
      where: {
        id: job.id,
        assignedCleanerId: expectedCleanerId,
      },
      data: {
        assignedCleanerId: null,
        assignedAt: null,
        status: JobStatus.CONFIRMED,
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
      where: { id: job.id },
      select: {
        id: true,
        status: true,
        assignedCleanerId: true,
        paymentStatus: true,
        quotedTotal: true,
        totalPrice: true,
        operationalTotal: true,
      },
    });
    if (!next) throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);

    await tx.jobTeamMember.deleteMany({ where: { jobId: job.id } });

    await tx.assignmentLog.create({
      data: {
        jobId: job.id,
        cleanerId: expectedCleanerId,
        branchId: job.branchId,
        outcome: ASSIGNMENT_RELEASED,
        reason: releaseReasonLabel(reason),
        details: {
          reasonCode: reason,
          notes: notes || null,
          offerId: acceptedOffer?.id ?? null,
          previousStatus: job.status,
          newStatus: next.status,
          releasedAt: now.toISOString(),
          releasedByAdminId: adminId,
          compensationAmount: acceptedOffer ? Number(acceptedOffer.compensationAmount) : null,
          compensationBasis: acceptedOffer?.compensationBasis ?? null,
          paymentStatusUnchanged: next.paymentStatus,
          quotedTotalUnchanged:
            next.quotedTotal != null ? Number(next.quotedTotal) : null,
          totalPriceUnchanged: next.totalPrice != null ? Number(next.totalPrice) : null,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        actorId: adminId,
        actorRole: 'ADMIN',
        action: JOB_ASSIGNMENT_RELEASED,
        entityType: 'Job',
        entityId: job.id,
        description: `Cleaner released from ${job.jobReference || job.id}. Accepted offer preserved.`,
        changes: {
          from: expectedCleanerId,
          to: null,
          offerId: acceptedOffer?.id ?? null,
          offerStatusUnchanged: acceptedOffer?.status ?? null,
          reason,
          notes: notes || null,
          paymentStatusUnchanged: next.paymentStatus,
        },
      },
    });

    return next;
  });

  await awaitJobCalendarSync(job.id);

  return {
    job: {
      id: updated.id,
      status: updated.status,
      assignedCleanerId: updated.assignedCleanerId,
      paymentStatus: updated.paymentStatus,
      quotedTotal: updated.quotedTotal != null ? Number(updated.quotedTotal) : null,
      totalPrice: updated.totalPrice != null ? Number(updated.totalPrice) : null,
      operationalTotal:
        updated.operationalTotal != null ? Number(updated.operationalTotal) : null,
    },
    offer: acceptedOffer
      ? {
          id: acceptedOffer.id,
          status: acceptedOffer.status,
          cleanerId: acceptedOffer.cleanerId,
          compensationAmount: Number(acceptedOffer.compensationAmount),
          compensationBasis: acceptedOffer.compensationBasis,
          offeredAt: acceptedOffer.offeredAt,
          expiresAt: acceptedOffer.expiresAt,
        }
      : null,
    release: { reason, notes: notes || null },
  };
}
