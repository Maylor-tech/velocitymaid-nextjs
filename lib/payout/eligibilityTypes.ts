/**
 * Phase 3A: Payout Eligibility Types
 * 
 * Type definitions for payout eligibility checking (read-only mode).
 * No payouts, no Stripe transfers, no writes.
 */

export interface PayoutEligibilityData {
  cleanerId: string;
  completedJobsCount: number;
  hasOpenDisputes: boolean;
  stripeAccountId: string | null;
  stripeAccountVerified: boolean;
  adminHold: boolean;
  eligibleAmountCents: number;
  taxProfileVerified?: boolean; // Optional: true if tax profile status is VERIFIED
}

export interface PayoutEligibilityResult {
  isEligible: boolean;
  eligibleAmountCents: number;
  blockers: PayoutEligibilityBlocker[];
  blockerDetails: PayoutEligibilityBlockerDetail[];
}

export interface PayoutEligibilityBlocker {
  type: BlockerType;
  message: string;
}

export interface PayoutEligibilityBlockerDetail {
  label: string;
  message: string;
}

export type BlockerType =
  | "INSUFFICIENT_JOBS"
  | "OPEN_DISPUTES"
  | "STRIPE_NOT_CONNECTED"
  | "STRIPE_NOT_VERIFIED"
  | "ADMIN_HOLD"
  | "ZERO_BALANCE"
  | "TAX_PROFILE_NOT_VERIFIED";

export const BLOCKER_TYPES = {
  INSUFFICIENT_JOBS: "INSUFFICIENT_JOBS" as const,
  OPEN_DISPUTES: "OPEN_DISPUTES" as const,
  STRIPE_NOT_CONNECTED: "STRIPE_NOT_CONNECTED" as const,
  STRIPE_NOT_VERIFIED: "STRIPE_NOT_VERIFIED" as const,
  ADMIN_HOLD: "ADMIN_HOLD" as const,
  ZERO_BALANCE: "ZERO_BALANCE" as const,
  TAX_PROFILE_NOT_VERIFIED: "TAX_PROFILE_NOT_VERIFIED" as const,
} as const;

