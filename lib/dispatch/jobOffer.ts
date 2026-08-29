/**
 * JobOffer domain — Vermont Phase 1 dispatcher.
 * Offer states live on JobOffer. Job stays RECEIVED/CONFIRMED until accept.
 * Accept must never change paymentStatus or reviewStatus.
 */
import {
  JobOfferStatus,
  JobStatus,
  Prisma,
  UserRole,
  type JobOffer,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isJobAssignable, resolveBillingPolicy } from '@/lib/billing/billingPolicy';
import { logAuditEntry } from '@/lib/audit';
import { APPROVED_CLEANER_APPLICATION_STATUSES } from '@/lib/cleaners/applicationStatus';
import { awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';
import {
  createAdminNotification,
  adminNotificationHelpers,
} from '@/lib/notifications/adminNotificationCenter';
import {
  assertCompensationNotCustomerTotal,
  parseApprovedCompensation,
} from '@/lib/dispatch/compensation';
import { DispatchError } from '@/lib/dispatch/errors';
import { computeExpiresAt, resolveOfferTtlMinutes } from '@/lib/dispatch/offerTtl';
import { notifyCleanerOfOffer } from '@/lib/dispatch/notifyOffer';
import type { DispatchUrgencyValue } from '@/lib/dispatch/offerTtl';

const OFFER_JOB_SELECT = {
  id: true,
  jobReference: true,
  status: true,
  paymentStatus: true,
  reviewStatus: true,
  billingPolicy: true,
  assignedCleanerId: true,
  branchId: true,
  operationalTotal: true,
  quotedTotal: true,
  totalPrice: true,
  estimatedDurationMins: true,
  internalNotes: true,
  dispatchUrgency: true,
  Customer: { select: { billingPolicy: true } },
  Branch: { select: { id: true, slug: true, country: true } },
} as const;

export type CreateOfferInput = {
  jobId: string;
  cleanerId: string;
  compensationAmount: unknown;
  estimatedDurationMins?: number | null;
  operationalNotes?: string | null;
  ttlMinutes?: number | null;
  channel?: 'EMAIL' | 'PORTAL';
  createdByAdminId?: string | null;
};

function uniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

async function assertCleanerEligible(
  cleanerId: string,
  jobBranchId: string,
  jobCountry: string | null,
  jobSlug: string | null
) {
  const cleaner = await prisma.user.findUnique({
    where: { id: cleanerId, role: UserRole.CLEANER },
    include: {
      UserBranch: { select: { branchId: true } },
      TrainingStatus: { select: { overallStatus: true } },
      CleanerProfile: { select: { isInternalTeam: true } },
    },
  });
  if (!cleaner) {
    throw new DispatchError('Cleaner not found', 'CLEANER_NOT_FOUND', 404);
  }
  if (!cleaner.isActive) {
    throw new DispatchError(
      'Cleaner is not active and cannot receive offers',
      'CLEANER_INACTIVE',
      403
    );
  }
  const branchIds = [
    cleaner.primaryBranchId,
    ...cleaner.UserBranch.map((ub) => ub.branchId),
  ].filter(Boolean) as string[];
  if (!branchIds.includes(jobBranchId)) {
    throw new DispatchError(
      'Cleaner must be in the same branch as the job',
      'BRANCH_MISMATCH',
      400
    );
  }
  const isInternalTeam = cleaner.CleanerProfile?.isInternalTeam === true;
  const approved = await prisma.cleanerApplication.findFirst({
    where: {
      email: cleaner.email,
      status: { in: [...APPROVED_CLEANER_APPLICATION_STATUSES] },
    },
    select: { id: true },
  });
  if (!isInternalTeam && !approved) {
    throw new DispatchError(
      'Cleaner does not have an approved application',
      'NOT_APPROVED',
      403
    );
  }
  const isJamaica =
    jobCountry === 'Jamaica' ||
    jobCountry === 'JM' ||
    jobSlug === 'port-antonio';
  if (isJamaica && cleaner.TrainingStatus?.overallStatus !== 'PASSED') {
    throw new DispatchError(
      'Cleaner has not passed required training for Jamaica jobs',
      'TRAINING_REQUIRED',
      403
    );
  }
  return cleaner;
}

export async function createJobOffer(input: CreateOfferInput): Promise<JobOffer> {
  if (!input.cleanerId) {
    throw new DispatchError('cleanerId is required', 'CLEANER_REQUIRED', 400);
  }
  const compensationAmount = parseApprovedCompensation(input.compensationAmount);

  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    select: OFFER_JOB_SELECT,
  });
  if (!job) throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);

  const billingPolicy = resolveBillingPolicy({
    jobPolicy: job.billingPolicy,
    customerPolicy: job.Customer?.billingPolicy,
  });
  if (!isJobAssignable({ ...job, billingPolicy })) {
    throw new DispatchError(
      job.paymentStatus === 'DEPOSIT_PAID' && job.reviewStatus !== 'APPROVED'
        ? 'Booking must be approved before sending an offer'
        : 'Job payment must be confirmed before sending an offer',
      job.paymentStatus === 'DEPOSIT_PAID' && job.reviewStatus !== 'APPROVED'
        ? 'REVIEW_REQUIRED'
        : 'PAYMENT_REQUIRED',
      400
    );
  }

  if (job.assignedCleanerId) {
    throw new DispatchError(
      'Job already has an assigned cleaner. Cancel assignment before sending an offer.',
      'ALREADY_ASSIGNED',
      409
    );
  }

  if (job.status !== JobStatus.RECEIVED && job.status !== JobStatus.CONFIRMED) {
    throw new DispatchError(
      `Job status ${job.status} does not allow an offer`,
      'INVALID_STATUS',
      400
    );
  }

  assertCompensationNotCustomerTotal({
    compensationAmount,
    quotedTotal: job.quotedTotal,
    totalPrice: job.totalPrice,
  });

  const existingOpen = await prisma.jobOffer.findFirst({
    where: { jobId: job.id, status: JobOfferStatus.OFFERED },
    select: { id: true },
  });
  if (existingOpen) {
    throw new DispatchError(
      'An offer is already outstanding. Cancel, expire, or wait for a response before offering another cleaner.',
      'OFFER_OPEN',
      409
    );
  }

  const cleaner = await assertCleanerEligible(
    input.cleanerId,
    job.branchId,
    job.Branch?.country ?? null,
    job.Branch?.slug ?? null
  );

  const offeredAt = new Date();
  const ttlMinutes = resolveOfferTtlMinutes({
    urgency: job.dispatchUrgency as DispatchUrgencyValue,
    ttlMinutes: input.ttlMinutes,
  });
  const expiresAt = computeExpiresAt(offeredAt, ttlMinutes);

  const adminId =
    input.createdByAdminId && input.createdByAdminId !== 'local-admin'
      ? input.createdByAdminId
      : null;

  let offer: JobOffer;
  try {
    offer = await prisma.jobOffer.create({
      data: {
        jobId: job.id,
        cleanerId: cleaner.id,
        status: JobOfferStatus.OFFERED,
        offeredAt,
        expiresAt,
        compensationAmount,
        compensationCurrency: 'USD',
        estimatedDurationMins:
          input.estimatedDurationMins ?? job.estimatedDurationMins ?? null,
        operationalNotes: input.operationalNotes ?? job.internalNotes ?? null,
        channel: input.channel ?? 'EMAIL',
        createdByAdminId: adminId,
      },
    });
  } catch (err) {
    if (uniqueViolation(err)) {
      throw new DispatchError(
        'An offer is already outstanding for this job',
        'OFFER_OPEN',
        409
      );
    }
    throw err;
  }

  await logAuditEntry({
    actorId: adminId,
    actorRole: 'ADMIN',
    action: 'JOB_OFFER_CREATED',
    entityType: 'JobOffer',
    entityId: offer.id,
    description: `Offer sent to cleaner ${cleaner.name || cleaner.id} for job ${job.jobReference || job.id}`,
    changes: {
      jobId: job.id,
      cleanerId: cleaner.id,
      compensationAmount,
      expiresAt: expiresAt.toISOString(),
      ttlMinutes,
      paymentStatusUnchanged: job.paymentStatus,
      reviewStatusUnchanged: job.reviewStatus,
    },
  });

  notifyCleanerOfOffer(offer.id).catch(() => {});
  return offer;
}

export async function cancelJobOffer(input: {
  jobId: string;
  offerId: string;
  adminId?: string | null;
}): Promise<JobOffer> {
  const offer = await prisma.jobOffer.findUnique({ where: { id: input.offerId } });
  if (!offer || offer.jobId !== input.jobId) {
    throw new DispatchError('Offer not found', 'OFFER_NOT_FOUND', 404);
  }
  if (offer.status !== JobOfferStatus.OFFERED) {
    throw new DispatchError(
      `Offer cannot be cancelled from ${offer.status}`,
      'INVALID_OFFER_STATUS',
      409
    );
  }

  const adminId =
    input.adminId && input.adminId !== 'local-admin' ? input.adminId : null;

  const updated = await prisma.jobOffer.update({
    where: { id: offer.id },
    data: {
      status: JobOfferStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledByAdminId: adminId,
    },
  });

  await logAuditEntry({
    actorId: adminId,
    actorRole: 'ADMIN',
    action: 'JOB_OFFER_CANCELLED',
    entityType: 'JobOffer',
    entityId: offer.id,
    description: `Offer cancelled for job ${input.jobId}`,
    changes: { from: 'OFFERED', to: 'CANCELLED' },
  });

  return updated;
}

export async function cancelOpenOffersForJob(
  jobId: string,
  adminId?: string | null
): Promise<number> {
  const open = await prisma.jobOffer.findMany({
    where: { jobId, status: JobOfferStatus.OFFERED },
    select: { id: true },
  });
  for (const row of open) {
    await cancelJobOffer({ jobId, offerId: row.id, adminId });
  }
  return open.length;
}

export async function acceptJobOffer(input: {
  offerId: string;
  cleanerId: string;
}): Promise<{ jobId: string; offerId: string; paymentStatus: string }> {
  const now = new Date();

  const result = await prisma.$transaction(
    async (tx) => {
      const offer = await tx.jobOffer.findUnique({
        where: { id: input.offerId },
        include: {
          Job: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              reviewStatus: true,
              assignedCleanerId: true,
              branchId: true,
              jobReference: true,
            },
          },
        },
      });
      if (!offer) {
        throw new DispatchError('Offer not found', 'OFFER_NOT_FOUND', 404);
      }
      if (offer.cleanerId !== input.cleanerId) {
        throw new DispatchError(
          'This offer is not for your account',
          'OFFER_NOT_YOURS',
          403
        );
      }

      await tx.$queryRaw`SELECT id FROM "Job" WHERE id = ${offer.jobId} FOR UPDATE`;

      const job = await tx.job.findUnique({
        where: { id: offer.jobId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          reviewStatus: true,
          assignedCleanerId: true,
          branchId: true,
          jobReference: true,
        },
      });
      if (!job) throw new DispatchError('Job not found', 'JOB_NOT_FOUND', 404);

      if (job.assignedCleanerId) {
        throw new DispatchError(
          'This job was already accepted by another cleaner',
          'ALREADY_ASSIGNED',
          409
        );
      }
      if (offer.status !== JobOfferStatus.OFFERED) {
        throw new DispatchError(
          `Offer is ${offer.status} and cannot be accepted`,
          'INVALID_OFFER_STATUS',
          409
        );
      }
      if (offer.expiresAt.getTime() <= now.getTime()) {
        throw new DispatchError('This offer has expired', 'OFFER_EXPIRED', 409);
      }

      const accepted = await tx.jobOffer.update({
        where: { id: offer.id },
        data: {
          status: JobOfferStatus.ACCEPTED,
          respondedAt: now,
        },
      });

      const updatedJob = await tx.job.update({
        where: { id: job.id },
        data: {
          assignedCleanerId: input.cleanerId,
          status: JobStatus.ASSIGNED,
          assignedAt: now,
        },
        select: {
          id: true,
          paymentStatus: true,
          reviewStatus: true,
          assignedCleanerId: true,
          status: true,
        },
      });

      if (updatedJob.paymentStatus !== job.paymentStatus) {
        throw new DispatchError(
          'Accept must not change payment status',
          'PAYMENT_MUTATION_BLOCKED',
          500
        );
      }
      if (updatedJob.reviewStatus !== job.reviewStatus) {
        throw new DispatchError(
          'Accept must not change customer commercial approval',
          'REVIEW_MUTATION_BLOCKED',
          500
        );
      }

      await tx.jobTeamMember.deleteMany({ where: { jobId: job.id } });
      await tx.jobTeamMember.create({
        data: { jobId: job.id, cleanerId: input.cleanerId, sortOrder: 0 },
      });

      await tx.assignmentLog.create({
        data: {
          jobId: job.id,
          cleanerId: input.cleanerId,
          branchId: job.branchId,
          outcome: 'ASSIGNED',
          reason: 'Cleaner accepted offer',
          details: {
            offerId: offer.id,
            acceptedAt: now.toISOString(),
            paymentStatus: job.paymentStatus,
            reviewStatus: job.reviewStatus,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          actorId: input.cleanerId,
          actorRole: 'CLEANER',
          action: 'JOB_OFFER_ACCEPTED',
          entityType: 'JobOffer',
          entityId: offer.id,
          description: `Cleaner accepted offer; assignment activated for ${job.jobReference || job.id}`,
          changes: {
            offerStatus: 'ACCEPTED',
            jobStatus: 'ASSIGNED',
            assignedCleanerId: input.cleanerId,
            paymentStatusUnchanged: job.paymentStatus,
            reviewStatusUnchanged: job.reviewStatus,
          },
        },
      });

      return {
        jobId: job.id,
        offerId: accepted.id,
        paymentStatus: updatedJob.paymentStatus,
        jobReference: job.jobReference,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  await awaitJobCalendarSync(result.jobId);

  createAdminNotification({
    type: 'CLEANER_ACCEPTED',
    severity: 'INFO',
    message: `Cleaner accepted offer for ${result.jobReference || result.jobId}`,
    jobId: result.jobId,
    actionUrl: adminNotificationHelpers.adminJobLink(result.jobId),
  }).catch(() => {});

  return {
    jobId: result.jobId,
    offerId: result.offerId,
    paymentStatus: result.paymentStatus,
  };
}

export async function declineJobOffer(input: {
  offerId: string;
  cleanerId: string;
  reason?: string | null;
}): Promise<{ jobId: string }> {
  const now = new Date();
  const offer = await prisma.jobOffer.findUnique({
    where: { id: input.offerId },
    include: { Job: { select: { id: true, branchId: true, jobReference: true } } },
  });
  if (!offer) throw new DispatchError('Offer not found', 'OFFER_NOT_FOUND', 404);
  if (offer.cleanerId !== input.cleanerId) {
    throw new DispatchError('This offer is not for your account', 'OFFER_NOT_YOURS', 403);
  }
  if (offer.status !== JobOfferStatus.OFFERED) {
    throw new DispatchError(
      `Offer is ${offer.status} and cannot be declined`,
      'INVALID_OFFER_STATUS',
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.jobOffer.update({
      where: { id: offer.id },
      data: {
        status: JobOfferStatus.DECLINED,
        respondedAt: now,
        declineReason: input.reason?.trim() || null,
      },
    });
    await tx.assignmentLog.create({
      data: {
        jobId: offer.jobId,
        cleanerId: input.cleanerId,
        branchId: offer.Job.branchId,
        outcome: 'DECLINED',
        reason: input.reason?.trim() || 'Declined by cleaner',
        details: { offerId: offer.id, declinedAt: now.toISOString() },
      },
    });
    await tx.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        actorId: input.cleanerId,
        actorRole: 'CLEANER',
        action: 'JOB_OFFER_DECLINED',
        entityType: 'JobOffer',
        entityId: offer.id,
        description: `Cleaner declined offer for ${offer.Job.jobReference || offer.jobId}`,
        changes: { from: 'OFFERED', to: 'DECLINED' },
      },
    });
  });

  createAdminNotification({
    type: 'CLEANER_DECLINED',
    severity: 'WARNING',
    message: `Cleaner declined offer for ${offer.Job.jobReference || offer.jobId} — cleaner needed`,
    jobId: offer.jobId,
    actionUrl: adminNotificationHelpers.adminJobLink(offer.jobId),
  }).catch(() => {});

  return { jobId: offer.jobId };
}

export async function expireOpenOffers(now: Date = new Date()): Promise<{
  expired: number;
  offerIds: string[];
}> {
  const stale = await prisma.jobOffer.findMany({
    where: {
      status: JobOfferStatus.OFFERED,
      expiresAt: { lte: now },
    },
    select: {
      id: true,
      jobId: true,
      Job: { select: { jobReference: true } },
    },
    take: 100,
  });

  const offerIds: string[] = [];
  for (const row of stale) {
    try {
      await prisma.jobOffer.update({
        where: { id: row.id, status: JobOfferStatus.OFFERED },
        data: { status: JobOfferStatus.EXPIRED, respondedAt: now },
      });
      offerIds.push(row.id);
      await logAuditEntry({
        action: 'JOB_OFFER_EXPIRED',
        entityType: 'JobOffer',
        entityId: row.id,
        description: `Offer expired for ${row.Job.jobReference || row.jobId}`,
        changes: { from: 'OFFERED', to: 'EXPIRED', jobId: row.jobId },
      });
      await createAdminNotification({
        type: 'CLEANER_NO_RESPONSE',
        severity: 'WARNING',
        message: `Offer expired for ${row.Job.jobReference || row.jobId} — cleaner needed`,
        jobId: row.jobId,
        actionUrl: adminNotificationHelpers.adminJobLink(row.jobId),
      });
    } catch (err) {
      console.error('[expireOpenOffers] failed', row.id, err);
    }
  }

  return { expired: offerIds.length, offerIds };
}

export async function loadOpenOfferForCleaner(jobId: string, cleanerId: string) {
  return prisma.jobOffer.findFirst({
    where: {
      jobId,
      cleanerId,
      status: JobOfferStatus.OFFERED,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function loadAcceptedOfferForCleaner(jobId: string, cleanerId: string) {
  return prisma.jobOffer.findFirst({
    where: {
      jobId,
      cleanerId,
      status: JobOfferStatus.ACCEPTED,
    },
  });
}
