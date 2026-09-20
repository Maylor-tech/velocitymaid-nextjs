import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveTipServiceEarner, TipBeneficiaryError } from '@/lib/tips/beneficiary';
import { guestFacingDisplayName } from '@/lib/stay/propertyGuestAccess';
import { formatServiceDate } from '@/lib/dates/serviceDate';

/** Display-only tip context — no jobId in response for hosts (client already has it). */
export type TipJobDisplayContext = {
  eligible: true;
  /** Human-readable property / service location — never access codes */
  propertyLabel: string;
  serviceType: string | null;
  /** ISO date string or null */
  serviceDate: string | null;
  /** Public job reference when present (e.g. VM-2026-0038) — hosts only; guests get null */
  jobReference: string | null;
  /** Generic acknowledgement; never cleaner name/phone */
  serviceAcknowledgement: string;
};

/**
 * Safe tip-page display context for a known jobId (host path).
 * Caller must verify customer ownership before invoking.
 */
export async function getTipJobDisplayContext(
  jobId: string
): Promise<TipJobDisplayContext> {
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
    eligible: true,
    propertyLabel,
    serviceType: job.serviceType?.trim() || null,
    serviceDate: job.preferredDate?.toISOString() ?? null,
    jobReference: job.jobReference?.trim() || null,
    serviceAcknowledgement: 'Thank your VelocityMaid cleaner for this service.',
  };
}

/**
 * Guest tip context — privacy-strict. Uses guestDisplayName only; no street, jobReference, or owner labels.
 */
export async function getGuestTipDisplayContext(
  jobId: string
): Promise<TipJobDisplayContext> {
  await resolveTipServiceEarner(jobId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      preferredDate: true,
      serviceType: true,
      Property: { select: { guestDisplayName: true } },
    },
  });

  if (!job || job.status !== JobStatus.COMPLETED) {
    throw new TipBeneficiaryError(
      'JOB_NOT_ELIGIBLE',
      'This job is not eligible for tipping.'
    );
  }

  const propertyLabel = guestFacingDisplayName(job.Property?.guestDisplayName);
  const serviceDate = job.preferredDate
    ? formatServiceDate(job.preferredDate, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return {
    eligible: true,
    propertyLabel,
    serviceType: job.serviceType?.trim() || null,
    serviceDate,
    jobReference: null,
    serviceAcknowledgement:
      'Thank your VelocityMaid cleaner for this stay — tips go to the cleaner who completed your clean.',
  };
}

/** @deprecated Use getTipJobDisplayContext */
export const getTipJobContext = getTipJobDisplayContext;
