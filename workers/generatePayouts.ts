/**
 * Review-only cleaner pay.
 * Writes one CleanerPayable per job and cleaner. Does not transfer money,
 * call Stripe, or email a cleaner.
 */
import { JobStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  agreedCleaningPrice,
  reviewPayables,
  type JobPayInput,
  type ManualPaymentInput,
  type Obligation,
} from '@/lib/cleanerComp/pay';

export type GeneratePayoutsOptions = {
  jobId?: string;
  branchId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  days?: number;
  maxJobs?: number;
  triggeredBy?: string;
};

export type GeneratePayoutsResult = {
  processed: number;
  created: number;
  skipped_no_cleaner: number;
  skipped_no_payment_method: number;
  skipped_no_policy: number;
  skipped_already_exists: number;
  errors: number;
  errorDetails: { jobId?: string; message: string }[];
  skippedJobs: { jobId: string; reason: string }[];
  debug: string[];
  review: {
    jobId: string;
    cleanerId: string;
    status: string;
    expected: number | null;
    paid: number;
    balance: number | null;
    persisted: boolean;
  }[];
};

function serviceDate(value: Date | null): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

function money(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export async function generatePayouts(
  options: GeneratePayoutsOptions = {}
): Promise<GeneratePayoutsResult> {
  const result: GeneratePayoutsResult = {
    processed: 0,
    created: 0,
    skipped_no_cleaner: 0,
    skipped_no_payment_method: 0,
    skipped_no_policy: 0,
    skipped_already_exists: 0,
    errors: 0,
    errorDetails: [],
    skippedJobs: [],
    debug: ['review-only: no transfers, no Stripe, no cleaner email'],
    review: [],
  };

  const completedAt: Prisma.DateTimeFilter = {};
  if (options.dateFrom) completedAt.gte = options.dateFrom;
  if (options.dateTo) completedAt.lte = options.dateTo;
  if (options.days && !options.dateFrom) {
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - options.days);
    completedAt.gte = from;
  }

  const jobs = await prisma.job.findMany({
    where: {
      status: JobStatus.COMPLETED,
      ...(options.jobId ? { id: options.jobId } : {}),
      ...(options.branchId ? { branchId: options.branchId } : {}),
      ...(Object.keys(completedAt).length ? { completedAt } : {}),
    },
    take: options.maxJobs ?? 500,
    orderBy: { completedAt: 'asc' },
    include: {
      CompensationAgreement: {
        orderBy: { setAt: 'desc' },
      },
    },
  });

  const cleanerIds = [
    ...new Set(
      jobs
        .map((job) => job.assignedCleanerId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const payments = cleanerIds.length
    ? await prisma.manualPayment.findMany({
        where: { cleanerId: { in: cleanerIds } },
        include: { allocations: true },
      })
    : [];
  const existing = cleanerIds.length
    ? await prisma.cleanerPayable.findMany({
        where: { cleanerId: { in: cleanerIds } },
      })
    : [];
  const terms = cleanerIds.length
    ? await prisma.cleanerCompTerms.findMany({
        where: { cleanerId: { in: cleanerIds } },
      })
    : [];
  const effectiveFrom = new Map(
    terms.map((row) => [row.cleanerId, row.effectiveFrom.toISOString().slice(0, 10)])
  );

  const paymentInputs: ManualPaymentInput[] = payments.map((payment) => ({
    id: payment.id,
    cleanerId: payment.cleanerId,
    date: serviceDate(payment.paidOn),
    amount: money(payment.amount) ?? 0,
    allocations: payment.allocations.map((allocation) => ({
      jobId: allocation.jobId,
      amount: money(allocation.amount) ?? 0,
      type: allocation.allocationType,
      memo: allocation.memo,
      appliedJobId: allocation.appliedJobId,
    })),
  }));
  const existingObligations: Obligation[] = existing.flatMap((row) => {
    if (row.status !== 'PAID_MANUALLY' && row.status !== 'OWED' && row.status !== 'OVERPAID') {
      return [];
    }
    return [
      {
        jobId: row.jobId,
        cleanerId: row.cleanerId,
        expected: money(row.expected) ?? 0,
        paid: money(row.paid) ?? 0,
        balance: money(row.balance) ?? 0,
        status: row.status,
      },
    ];
  });

  const payInputs: JobPayInput[] = [];
  for (const job of jobs) {
    result.processed += 1;
    if (!job.assignedCleanerId) {
      result.skipped_no_cleaner += 1;
      result.skippedJobs.push({ jobId: job.id, reason: 'no cleaner' });
      continue;
    }
    const agreement =
      job.CompensationAgreement.find((row) => row.cleanerId === job.assignedCleanerId) ??
      job.CompensationAgreement[0];
    if (!agreement) {
      result.skipped_no_policy += 1;
      result.skippedJobs.push({ jobId: job.id, reason: 'no compensation agreement' });
      continue;
    }
    if (job.status === JobStatus.COMPLETED && !agreement.frozenAt) {
      await prisma.compensationAgreement.update({
        where: { id: agreement.id },
        data: { frozenAt: job.completedAt ?? new Date() },
      });
      agreement.frozenAt = job.completedAt ?? new Date();
    }
    payInputs.push({
      jobId: job.id,
      cleanerId: job.assignedCleanerId,
      serviceDate: serviceDate(job.completedAt ?? job.preferredDate),
      completed: true,
      agreedCleaningPrice: agreedCleaningPrice({
        agreedOperationalPrice: job.agreedOperationalPrice,
        agreedCustomerPrice: job.agreedCustomerPrice,
        processingAllowance: job.processingAllowanceEstimated,
        includedAddOns: agreement.includedAddOns,
      }),
      tip: 0,
      termsEffectiveFrom: effectiveFrom.get(job.assignedCleanerId) ?? null,
      agreement: {
        method: agreement.method,
        rate: money(agreement.rate) ?? 0,
        eligibleBase: money(agreement.eligibleBase),
        manualEligibleBase: agreement.manualEligibleBase,
        payBasis: agreement.payBasis,
        includedAddOns: agreement.includedAddOns,
        assisted: agreement.assisted,
        verifiedHours: money(agreement.verifiedHours),
        hoursVerifiedBy: agreement.hoursVerifiedBy,
        hoursVerifiedAt: agreement.hoursVerifiedAt?.toISOString() ?? null,
        frozenAt: agreement.frozenAt?.toISOString() ?? null,
      },
    });
  }

  const reviewed = reviewPayables({
    jobs: payInputs,
    payments: paymentInputs,
    existing: existingObligations,
  });

  for (const row of reviewed.rows) {
    result.review.push({
      jobId: row.jobId,
      cleanerId: row.cleanerId,
      status: row.status,
      expected: row.expected,
      paid: row.paid,
      balance: row.balance,
      persisted: row.persisted,
    });
    if (
      row.persisted &&
      existingObligations.some((item) => item.jobId === row.jobId && item.cleanerId === row.cleanerId)
    ) {
      result.skipped_already_exists += 1;
    }
  }

  const fresh = reviewed.obligations.filter(
    (row) =>
      !existingObligations.some((item) => item.jobId === row.jobId && item.cleanerId === row.cleanerId)
  );
  for (const obligation of fresh) {
    try {
      await prisma.cleanerPayable.create({
        data: {
          jobId: obligation.jobId,
          cleanerId: obligation.cleanerId,
          expected: obligation.expected,
          paid: obligation.paid,
          balance: obligation.balance,
          status: obligation.status,
        },
      });
      result.created += 1;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        result.skipped_already_exists += 1;
        continue;
      }
      result.errors += 1;
      result.errorDetails.push({
        jobId: obligation.jobId,
        message: error instanceof Error ? error.message : 'Could not save the review row',
      });
    }
  }

  return result;
}
