/**
 * Canonical orchestration for the COMPLETED + PAID → JobPayout invariant.
 *
 * Call this after any state transition that may have produced:
 *   - Job.status === COMPLETED, and/or
 *   - Job.paymentStatus === PAID
 *
 * Does not calculate payout amounts, transfer money, change compensation, or touch tips.
 * createPayoutIfEligible remains the sole eligibility + ledger-create gate (idempotent).
 */

import {
  createPayoutIfEligible,
  type CreatePayoutResult,
} from '@/src/server/payout/createPayoutIfEligible';

export async function maybeCreatePayoutAfterTransition(
  jobId: string
): Promise<CreatePayoutResult> {
  return createPayoutIfEligible(jobId);
}
