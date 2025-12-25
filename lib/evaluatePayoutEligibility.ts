/**
 * Payout Eligibility Evaluator
 * 
 * Evaluates whether a job is eligible for payout generation.
 * Returns detailed reasons if the job is not eligible.
 */

import { PayoutSkipReason, SkippedJobDebug } from "./payoutDebug";

export interface EligibilityEvaluationInput {
  job: {
    id: string;
    status: string;
    assignedCleanerId: string | null;
    totalPrice?: number | null;
    completedAt?: Date | null;
    payoutStatus?: string | null;
  };
  cleaner?: {
    id: string;
    isActive: boolean;
  } | null;
  paymentMethod?: {
    id: string;
    isActive: boolean;
    verifiedAt: Date | null;
  } | null;
  existingPayout?: {
    id: string;
  } | null;
  withinWindow: boolean;
  hasPolicy: boolean;
}

export interface EligibilityEvaluationResult {
  eligible: boolean;
  reasons: PayoutSkipReason[];
}

/**
 * Evaluates if a job is eligible for payout generation
 */
export function evaluatePayoutEligibility({
  job,
  cleaner,
  paymentMethod,
  existingPayout,
  withinWindow,
  hasPolicy,
}: EligibilityEvaluationInput): EligibilityEvaluationResult {
  const reasons: PayoutSkipReason[] = [];

  // Check job has assigned cleaner
  if (!job.assignedCleanerId) {
    reasons.push(PayoutSkipReason.NO_ASSIGNED_CLEANER);
  }

  // Check job is completed
  if (job.status !== "COMPLETED") {
    reasons.push(PayoutSkipReason.JOB_NOT_COMPLETED);
  }

  // Check job has total amount
  if (!job.totalPrice || Number(job.totalPrice) <= 0) {
    reasons.push(PayoutSkipReason.MISSING_TOTAL_AMOUNT);
  }

  // Check cleaner exists and is active
  if (!cleaner) {
    // Only add this if we have an assigned cleaner ID (otherwise NO_ASSIGNED_CLEANER covers it)
    if (job.assignedCleanerId) {
      reasons.push(PayoutSkipReason.CLEANER_NOT_ACTIVE);
    }
  } else if (!cleaner.isActive) {
    reasons.push(PayoutSkipReason.CLEANER_NOT_ACTIVE);
  }

  // Check payment method exists
  if (!paymentMethod) {
    reasons.push(PayoutSkipReason.NO_PAYMENT_METHOD);
  } else {
    // Check payment method is active
    if (!paymentMethod.isActive) {
      reasons.push(PayoutSkipReason.PAYMENT_METHOD_NOT_ACTIVE);
    }
    // Check payment method is verified
    if (!paymentMethod.verifiedAt) {
      reasons.push(PayoutSkipReason.PAYMENT_METHOD_NOT_VERIFIED);
    }
  }

  // Check payout policy exists
  if (!hasPolicy) {
    reasons.push(PayoutSkipReason.NO_PAYOUT_POLICY);
  }

  // Check payout doesn't already exist
  if (existingPayout) {
    reasons.push(PayoutSkipReason.PAYOUT_ALREADY_CREATED);
  }

  // Check job is within payout window
  if (!withinWindow) {
    reasons.push(PayoutSkipReason.OUTSIDE_PAYOUT_WINDOW);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}













