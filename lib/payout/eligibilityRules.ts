/**
 * PHASE 3A – PAYOUT ELIGIBILITY (READ-ONLY)
 *
 * This module is intentionally PURE and SIDE-EFFECT FREE.
 * - No Prisma
 * - No Stripe
 * - No writes
 *
 * Covered by unit tests.
 * Changes here affect payout safety and require explicit review.
 */

import type {
  PayoutEligibilityData,
  PayoutEligibilityResult,
  PayoutEligibilityBlocker,
  BlockerType,
} from "./eligibilityTypes";

/**
 * Minimum number of completed jobs required for payout eligibility
 */
const MIN_COMPLETED_JOBS = 3;

/**
 * Evaluate payout eligibility for a cleaner
 * 
 * Pure function - no side effects, no database access, no writes.
 * This is the single public API for eligibility checking.
 */
export function evaluatePayoutEligibility(
  data: PayoutEligibilityData
): PayoutEligibilityResult {
  const blockers: PayoutEligibilityBlocker[] = [];

  // Rule 1: Must have at least MIN_COMPLETED_JOBS completed jobs
  if (data.completedJobsCount < MIN_COMPLETED_JOBS) {
    blockers.push({
      type: "INSUFFICIENT_JOBS",
      message: `Must complete at least ${MIN_COMPLETED_JOBS} jobs. Currently: ${data.completedJobsCount}`,
    });
  }

  // Rule 2: No open disputes
  if (data.hasOpenDisputes) {
    blockers.push({
      type: "OPEN_DISPUTES",
      message: "Cannot receive payouts while there are open disputes",
    });
  }

  // Rule 3: Stripe account must be connected
  if (!data.stripeAccountId) {
    blockers.push({
      type: "STRIPE_NOT_CONNECTED",
      message: "Stripe account not connected. Please complete payout setup.",
    });
  }

  // Rule 4: Stripe account must be verified
  if (data.stripeAccountId && !data.stripeAccountVerified) {
    blockers.push({
      type: "STRIPE_NOT_VERIFIED",
      message: "Stripe account verification pending. Please complete verification.",
    });
  }

  // Rule 5: No admin hold
  if (data.adminHold) {
    blockers.push({
      type: "ADMIN_HOLD",
      message: "Payouts are on hold. Please contact support.",
    });
  }

  // Rule 6: Must have eligible balance > 0
  if (data.eligibleAmountCents <= 0) {
    blockers.push({
      type: "ZERO_BALANCE",
      message: "No eligible balance available for payout",
    });
  }

  // Rule 7: Tax profile must be verified (optional gate)
  // Only check if taxProfileVerified is explicitly provided (not undefined)
  if (data.taxProfileVerified !== undefined && !data.taxProfileVerified) {
    blockers.push({
      type: "TAX_PROFILE_NOT_VERIFIED",
      message: "Tax profile must be verified before receiving payouts. Please complete and submit your W-9 form.",
    });
  }

  const isEligible = blockers.length === 0 && data.eligibleAmountCents > 0;

  return {
    isEligible,
    eligibleAmountCents: isEligible ? data.eligibleAmountCents : 0,
    blockers,
    blockerDetails: [], // Will be populated by eligibilityService
  };
}

/**
 * Get the primary blocker (first blocker in priority order)
 * 
 * Internal helper - not exported to prevent logic leakage
 */
function getPrimaryBlocker(
  blockers: PayoutEligibilityBlocker[]
): PayoutEligibilityBlocker | null {
  if (blockers.length === 0) return null;

  // Priority order for blockers
  const priority: BlockerType[] = [
    "ADMIN_HOLD",
    "OPEN_DISPUTES",
    "TAX_PROFILE_NOT_VERIFIED",
    "STRIPE_NOT_CONNECTED",
    "STRIPE_NOT_VERIFIED",
    "INSUFFICIENT_JOBS",
    "ZERO_BALANCE",
  ];

  for (const blockerType of priority) {
    const blocker = blockers.find((b) => b.type === blockerType);
    if (blocker) return blocker;
  }

  return blockers[0];
}

