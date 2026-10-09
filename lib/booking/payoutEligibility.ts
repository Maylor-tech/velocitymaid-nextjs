import { JobStatus, PaymentStatus } from '@prisma/client';

type JobPayoutSnapshot = {
  id: string;
  status: string;
  cleanerAmount?: number | null;
  grossAmount?: number | null;
};

export type PayoutEligibility = {
  eligible: boolean;
  reason: string;
  payoutRecord: JobPayoutSnapshot | null;
};

type EligibilityInput = {
  status: string | JobStatus;
  paymentStatus: string | PaymentStatus;
  assignedCleanerId: string | null;
  JobPayout?: JobPayoutSnapshot | JobPayoutSnapshot[] | null;
};

function resolvePayout(
  payout: JobPayoutSnapshot | JobPayoutSnapshot[] | null | undefined
): JobPayoutSnapshot | null {
  if (!payout) return null;
  if (Array.isArray(payout)) return payout[0] ?? null;
  return payout;
}

export function computePayoutEligibility(job: EligibilityInput): PayoutEligibility {
  const payout = resolvePayout(job.JobPayout);

  if (payout) {
    const isReady = payout.status === 'READY' || payout.status === 'PAID';
    return {
      eligible: isReady,
      reason: isReady
        ? `Payout ${payout.status.toLowerCase()} for cleaner`
        : `Payout record exists (${payout.status})`,
      payoutRecord: payout,
    };
  }

  if (job.status !== JobStatus.COMPLETED && job.status !== 'COMPLETED') {
    return {
      eligible: false,
      reason: 'Job must be completed before cleaner payout',
      payoutRecord: null,
    };
  }

  if (job.paymentStatus !== PaymentStatus.PAID && job.paymentStatus !== 'PAID') {
    return {
      eligible: false,
      reason: 'Full payment required before cleaner payout',
      payoutRecord: null,
    };
  }

  if (!job.assignedCleanerId) {
    return {
      eligible: false,
      reason: 'No cleaner assigned',
      payoutRecord: null,
    };
  }

  return {
    eligible: true,
    reason:
      'Customer is paid and a cleaner is assigned, but no payout record exists yet. Create it from payouts or wait for the paid-job webhook.',
    payoutRecord: null,
  };
}
