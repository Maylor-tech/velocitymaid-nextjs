import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class TipBeneficiaryError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TipBeneficiaryError';
    this.code = code;
  }
}

export type TipServiceEarner = {
  jobId: string;
  propertyId: string | null;
  beneficiaryCleanerId: string;
  branchId: string;
  marketLabel: string | null;
};

/**
 * Freeze tip beneficiary at intent creation from the verified service earner.
 * Fail closed if the job is not tip-eligible or earner cannot be determined.
 * Never uses cleanerName, user-provided cleanerId, or arbitrary current assignee guesswork.
 */
export async function resolveTipServiceEarner(
  jobId: string
): Promise<TipServiceEarner> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      assignedCleanerId: true,
      propertyId: true,
      branchId: true,
      marketLabel: true,
      completedAt: true,
    },
  });

  if (!job) {
    throw new TipBeneficiaryError('JOB_NOT_FOUND', 'Job not found.');
  }

  if (
    job.status === JobStatus.CANCELLED ||
    job.status === JobStatus.CANCELLED_EMERGENCY
  ) {
    throw new TipBeneficiaryError(
      'JOB_NOT_ELIGIBLE',
      'This job is not eligible for tipping.'
    );
  }

  if (job.status !== JobStatus.COMPLETED) {
    throw new TipBeneficiaryError(
      'JOB_NOT_COMPLETED',
      'Tips are only available after the cleaning is completed.'
    );
  }

  if (!job.assignedCleanerId) {
    throw new TipBeneficiaryError(
      'NO_SERVICE_EARNER',
      'Could not determine the cleaner who performed this job. Tip cannot be started.'
    );
  }

  const cleaner = await prisma.user.findFirst({
    where: {
      id: job.assignedCleanerId,
      role: 'CLEANER',
    },
    select: { id: true },
  });

  if (!cleaner) {
    throw new TipBeneficiaryError(
      'NO_SERVICE_EARNER',
      'Could not verify the service earner for this job.'
    );
  }

  return {
    jobId: job.id,
    propertyId: job.propertyId,
    beneficiaryCleanerId: cleaner.id,
    branchId: job.branchId,
    marketLabel: job.marketLabel,
  };
}
