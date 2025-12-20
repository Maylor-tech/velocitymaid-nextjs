/**
 * Payout Skip Reasons
 * 
 * Enum of all possible reasons why a job might be skipped during payout generation.
 * Used for debugging, audit trails, and admin transparency.
 */

export enum PayoutSkipReason {
  NO_ASSIGNED_CLEANER = "No cleaner assigned",
  CLEANER_NOT_ACTIVE = "Cleaner not active",
  NO_PAYMENT_METHOD = "No payment method on file",
  PAYMENT_METHOD_NOT_VERIFIED = "Payment method not verified",
  JOB_NOT_COMPLETED = "Job not completed",
  PAYOUT_ALREADY_CREATED = "Payout already exists",
  OUTSIDE_PAYOUT_WINDOW = "Outside payout date range",
  MISSING_TOTAL_AMOUNT = "Missing job total amount",
  NO_PAYOUT_POLICY = "No payout policy found",
  PAYMENT_METHOD_NOT_ACTIVE = "Payment method not active",
}

/**
 * Debug result for a skipped job
 */
export interface SkippedJobDebug {
  jobId: string;
  reasons: PayoutSkipReason[];
  jobDetails?: {
    status?: string;
    assignedCleanerId?: string | null;
    completedAt?: Date | null;
    totalPrice?: number | null;
  };
}






