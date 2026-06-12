import { JobStatus, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { calcPayout } from '@/lib/payoutRules';

export type CreatePayoutResult =
  | { ok: true; reason: 'CREATED' | 'ALREADY_EXISTS'; payoutId: string }
  | { ok: false; reason: string };

/**
 * Create a JobPayout when a job is fully paid and completed.
 * Never pays out on deposit-only or balance-due jobs.
 */
export async function createPayoutIfEligible(jobId: string): Promise<CreatePayoutResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      totalPrice: true,
      quotedTotal: true,
      branchId: true,
      assignedCleanerId: true,
      currency: true,
    },
  });

  if (!job) return { ok: false, reason: 'JOB_NOT_FOUND' };
  if (job.status !== JobStatus.COMPLETED) return { ok: false, reason: 'NOT_COMPLETED' };
  if (job.paymentStatus !== PaymentStatus.PAID) {
    return { ok: false, reason: 'NOT_FULLY_PAID' };
  }
  if (!job.assignedCleanerId) return { ok: false, reason: 'NO_CLEANER' };

  const existing = await prisma.jobPayout.findUnique({ where: { jobId } });
  if (existing) {
    return { ok: true, reason: 'ALREADY_EXISTS', payoutId: existing.id };
  }

  const grossAmount = job.quotedTotal
    ? Number(job.quotedTotal)
    : job.totalPrice
      ? Number(job.totalPrice)
      : 0;

  if (grossAmount <= 0) {
    return { ok: false, reason: 'ZERO_GROSS_AMOUNT' };
  }

  const { cleanerAmount, platformFee, rulesVersion } = calcPayout(grossAmount);

  const payout = await prisma.jobPayout.create({
    data: {
      id: randomUUID(),
      jobId: job.id,
      branchId: job.branchId,
      cleanerId: job.assignedCleanerId,
      grossAmount,
      cleanerAmount,
      platformFee,
      currency: job.currency || 'USD',
      status: 'READY',
      rulesVersion,
    },
  });

  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      entityType: 'JobPayout',
      entityId: payout.id,
      action: 'PAYOUT_CREATED',
      actorRole: 'SYSTEM',
      description: `Payout created for job ${job.id} after full payment`,
      changes: {
        grossAmount,
        cleanerAmount,
        platformFee,
        rulesVersion,
        trigger: 'balance_paid',
      },
    },
  });

  return { ok: true, reason: 'CREATED', payoutId: payout.id };
}
