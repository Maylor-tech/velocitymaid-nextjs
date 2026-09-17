/**
 * Canonical orchestration for COMPLETED → JobPayout (READY) payable creation.
 *
 * Call after any transition that may have produced Job.status === COMPLETED
 * (and optionally after customer payment — still idempotent).
 *
 * Customer PAID is NOT required to record cleaner payable.
 * Does not transfer money, change tips, or settle payouts.
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
