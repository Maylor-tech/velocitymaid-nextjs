import { JobOfferStatus, JobStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { calcPayout, round2 } from '@/lib/payoutRules';

export type CreatePayoutResult =
  | { ok: true; reason: 'CREATED' | 'ALREADY_EXISTS'; payoutId: string }
  | { ok: false; reason: string };

export type CompensationSource = 'ACCEPTED_OFFER' | 'CALCULATED_FALLBACK';

export type ResolvedCleanerCompensation =
  | {
      ok: true;
      source: 'ACCEPTED_OFFER';
      cleanerAmount: number;
      offerId: string;
      cleanerId: string;
    }
  | {
      ok: true;
      source: 'CALCULATED_FALLBACK';
      cleanerAmount: number;
      grossAmount: number;
      platformFee: number;
      rulesVersion: string;
      cleanerId: string;
    }
  | { ok: false; reason: string };

/**
 * Resolve agreed cleaner compensation for a COMPLETED job.
 *
 * ACCEPTED JobOffer for the *current* assignedCleanerId wins.
 * Historical ACCEPTED offers for other cleaners are ignored (reassignment safety).
 * Legacy/no-offer jobs use explicit CALCULATED_FALLBACK (calcPayout on ops/quoted/total).
 */
export async function resolveCleanerCompensationForJob(job: {
  id: string;
  assignedCleanerId: string | null;
  totalPrice: unknown;
  quotedTotal: unknown;
  operationalTotal: unknown;
}): Promise<ResolvedCleanerCompensation> {
  if (!job.assignedCleanerId) {
    return { ok: false, reason: 'NO_CLEANER' };
  }

  const acceptedOffer = await prisma.jobOffer.findFirst({
    where: {
      jobId: job.id,
      cleanerId: job.assignedCleanerId,
      status: JobOfferStatus.ACCEPTED,
    },
    orderBy: { respondedAt: 'desc' },
    select: {
      id: true,
      compensationAmount: true,
      cleanerId: true,
    },
  });

  if (acceptedOffer) {
    const cleanerAmount = round2(Number(acceptedOffer.compensationAmount));
    if (!Number.isFinite(cleanerAmount) || cleanerAmount <= 0) {
      return { ok: false, reason: 'INVALID_OFFER_AMOUNT' };
    }
    return {
      ok: true,
      source: 'ACCEPTED_OFFER',
      cleanerAmount,
      offerId: acceptedOffer.id,
      cleanerId: acceptedOffer.cleanerId,
    };
  }

  // Legacy / admin / non-dispatch path — explicit calculated fallback.
  // Not an accepted agreement; labeled CALCULATED_FALLBACK in audit metadata.
  const grossAmount =
    job.operationalTotal != null
      ? Number(job.operationalTotal)
      : job.quotedTotal
        ? Number(job.quotedTotal)
        : job.totalPrice
          ? Number(job.totalPrice)
          : 0;

  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    return { ok: false, reason: 'NO_SAFE_COMPENSATION' };
  }

  const calculated = calcPayout(grossAmount);
  return {
    ok: true,
    source: 'CALCULATED_FALLBACK',
    cleanerAmount: calculated.cleanerAmount,
    grossAmount: calculated.grossAmount,
    platformFee: calculated.platformFee,
    rulesVersion: calculated.rulesVersion,
    cleanerId: job.assignedCleanerId,
  };
}

function economicsGross(job: {
  totalPrice: unknown;
  quotedTotal: unknown;
  operationalTotal: unknown;
}): number {
  if (job.operationalTotal != null) return round2(Number(job.operationalTotal));
  if (job.quotedTotal != null) return round2(Number(job.quotedTotal));
  if (job.totalPrice != null) return round2(Number(job.totalPrice));
  return 0;
}

/**
 * Create a JobPayout (READY) when a job is COMPLETED and cleaner compensation
 * can be determined safely.
 *
 * Customer paymentStatus is intentionally NOT required — payable ≠ collected.
 * Does not transfer money. Idempotent per jobId.
 */
export async function createPayoutIfEligible(
  jobId: string
): Promise<CreatePayoutResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      totalPrice: true,
      quotedTotal: true,
      operationalTotal: true,
      branchId: true,
      assignedCleanerId: true,
      currency: true,
    },
  });

  if (!job) return { ok: false, reason: 'JOB_NOT_FOUND' };
  if (job.status !== JobStatus.COMPLETED) {
    return { ok: false, reason: 'NOT_COMPLETED' };
  }
  if (!job.assignedCleanerId) return { ok: false, reason: 'NO_CLEANER' };

  const existing = await prisma.jobPayout.findUnique({ where: { jobId } });
  if (existing) {
    return { ok: true, reason: 'ALREADY_EXISTS', payoutId: existing.id };
  }

  const resolved = await resolveCleanerCompensationForJob(job);
  if (resolved.ok === false) {
    return { ok: false, reason: resolved.reason };
  }

  let grossAmount: number;
  let cleanerAmount: number;
  let platformFee: number;
  let rulesVersion: string;
  const compensationSource: CompensationSource = resolved.source;

  if (resolved.source === 'ACCEPTED_OFFER') {
    cleanerAmount = resolved.cleanerAmount;
    // Job economics for fee display only — never recalculates cleanerAmount.
    grossAmount = economicsGross(job);
    if (grossAmount <= 0) {
      // Offer is the agreement; use offer as gross if customer totals missing.
      grossAmount = cleanerAmount;
      platformFee = 0;
    } else {
      platformFee = round2(grossAmount - cleanerAmount);
    }
    rulesVersion = 'accepted-offer';
  } else {
    grossAmount = resolved.grossAmount;
    cleanerAmount = resolved.cleanerAmount;
    platformFee = resolved.platformFee;
    rulesVersion = resolved.rulesVersion;
  }

  const payout = await prisma.jobPayout.create({
    data: {
      id: randomUUID(),
      jobId: job.id,
      branchId: job.branchId,
      cleanerId: resolved.cleanerId,
      grossAmount,
      cleanerAmount,
      platformFee,
      currency: job.currency || 'USD',
      status: 'READY',
      rulesVersion,
      policyEvalDetails: {
        compensationSource,
        customerPaymentStatus: job.paymentStatus,
        ...(resolved.source === 'ACCEPTED_OFFER'
          ? { acceptedOfferId: resolved.offerId }
          : {}),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      entityType: 'JobPayout',
      entityId: payout.id,
      action: 'PAYOUT_CREATED',
      actorRole: 'SYSTEM',
      description: `Payout created for completed job ${job.id} (${compensationSource})`,
      changes: {
        grossAmount,
        cleanerAmount,
        platformFee,
        rulesVersion,
        compensationSource,
        customerPaymentStatus: job.paymentStatus,
        trigger: 'job_completed_payable',
        ...(resolved.source === 'ACCEPTED_OFFER'
          ? { acceptedOfferId: resolved.offerId }
          : {}),
      },
    },
  });

  return { ok: true, reason: 'CREATED', payoutId: payout.id };
}
