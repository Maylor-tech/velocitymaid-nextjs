import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveTipServiceEarner, TipBeneficiaryError } from '@/lib/tips/beneficiary';

export type TipJobContext = {
  jobId: string;
  eligible: true;
  /** Human-readable property / service location — never access codes */
  propertyLabel: string;
  serviceType: string | null;
  /** ISO date string or null */
  serviceDate: string | null;
  /** Public job reference when present (e.g. VM-2026-0038) */
  jobReference: string | null;
};

/**
 * Safe tip-page display context for a known jobId.
 * Reuses tip eligibility (COMPLETED + assigned cleaner). Exposes no owner PII,
 * access notes, cleaner contact info, or other jobs.
 */
export async function getTipJobContext(jobId: string): Promise<TipJobContext> {
  await resolveTipServiceEarner(jobId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      serviceType: true,
      preferredDate: true,
      address: true,
      jobReference: true,
      Property: { select: { name: true, address: true } },
    },
  });

  if (!job || job.status !== JobStatus.COMPLETED) {
    throw new TipBeneficiaryError(
      'JOB_NOT_ELIGIBLE',
      'This job is not eligible for tipping.'
    );
  }

  const propertyLabel =
    job.Property?.name?.trim() ||
    job.Property?.address?.trim() ||
    job.address?.trim() ||
    'Completed cleaning';

  return {
    jobId: job.id,
    eligible: true,
    propertyLabel,
    serviceType: job.serviceType?.trim() || null,
    serviceDate: job.preferredDate?.toISOString() ?? null,
    jobReference: job.jobReference?.trim() || null,
  };
}
