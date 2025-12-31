/**
 * Phase 3A: Payout Eligibility Messages
 * 
 * User-friendly messages for payout eligibility blockers.
 */

import type { PayoutEligibilityBlockerDetail, BlockerType } from "./eligibilityTypes";

/**
 * Get user-friendly blocker details
 */
export function getBlockerDetails(
  blockerType: BlockerType,
  data?: { completedJobsCount?: number; eligibleAmountCents?: number }
): PayoutEligibilityBlockerDetail {
  switch (blockerType) {
    case "INSUFFICIENT_JOBS":
      return {
        label: "Minimum Jobs Required",
        message: `You need to complete at least 3 jobs before you can receive payouts. You've completed ${data?.completedJobsCount || 0} job${data?.completedJobsCount !== 1 ? "s" : ""}.`,
      };

    case "OPEN_DISPUTES":
      return {
        label: "Open Disputes",
        message:
          "You have open disputes that must be resolved before you can receive payouts. Please contact support if you have questions.",
      };

    case "STRIPE_NOT_CONNECTED":
      return {
        label: "Payout Setup Required",
        message:
          "You need to connect your Stripe account to receive payouts. Please complete the payout setup in your account settings.",
      };

    case "STRIPE_NOT_VERIFIED":
      return {
        label: "Account Verification Pending",
        message:
          "Your Stripe account verification is still pending. Please complete the verification process to receive payouts.",
      };

    case "ADMIN_HOLD":
      return {
        label: "Payouts On Hold",
        message:
          "Your payouts are currently on hold. Please contact support for more information.",
      };

    case "ZERO_BALANCE":
      return {
        label: "No Eligible Balance",
        message: `You don't have any eligible balance available for payout at this time.`,
      };

    case "TAX_PROFILE_NOT_VERIFIED":
      return {
        label: "Tax Profile Not Verified",
        message:
          "Your W-9 tax form must be verified before you can receive payouts. Please complete and submit your tax form, then wait for admin verification.",
      };

    default:
      return {
        label: "Eligibility Issue",
        message: "There is an issue with your payout eligibility. Please contact support.",
      };
  }
}

/**
 * Get all blocker details for a list of blockers
 */
export function getAllBlockerDetails(
  blockers: Array<{ type: BlockerType }>,
  data?: { completedJobsCount?: number; eligibleAmountCents?: number }
): PayoutEligibilityBlockerDetail[] {
  return blockers.map((blocker) => getBlockerDetails(blocker.type, data));
}

