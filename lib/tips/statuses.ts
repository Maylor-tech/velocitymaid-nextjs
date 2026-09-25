/** Canonical Tip statuses (new writes). Legacy: pending | succeeded | failed. */

export const TIP_STATUSES = [
  'PENDING',
  'RECEIVED',
  'RECEIVED_UNATTRIBUTED',
  'PAID_OUT',
  'CANCELLED',
  'FAILED',
  'REFUNDED',
] as const;

export type TipStatus = (typeof TIP_STATUSES)[number];

export const TIP_DISPUTE_STATUSES = ['NONE', 'OPEN', 'WON', 'LOST'] as const;
export type TipDisputeStatus = (typeof TIP_DISPUTE_STATUSES)[number];

export const TIP_PAYMENT_METHODS = ['STRIPE', 'ZELLE', 'MANUAL'] as const;
export type TipPaymentMethod = (typeof TIP_PAYMENT_METHODS)[number];

export const TIP_RECONCILE_REASONS = [
  'STRIPE_SUCCEEDED_TIP_PENDING',
  'PI_ATTACH_INCOMPLETE',
  'REFUND_AFTER_PAID_OUT',
  'DISPUTE_AFTER_PAID_OUT',
  'DISPUTE_LOST_AFTER_PAID_OUT',
  'STRIPE_LEDGER_MISMATCH',
  'WEBHOOK_PROCESSING_FAILURE',
] as const;
export type TipReconcileReason = (typeof TIP_RECONCILE_REASONS)[number];

/** Normalize legacy + canonical status strings. */
export function normalizeTipStatus(
  raw: string | null | undefined
): TipStatus | string {
  if (!raw) return 'PENDING';
  const s = raw.trim();
  const upper = s.toUpperCase();
  if (upper === 'SUCCEEDED') return 'RECEIVED';
  if (upper === 'PENDING') return 'PENDING';
  if (upper === 'FAILED') return 'FAILED';
  if ((TIP_STATUSES as readonly string[]).includes(upper)) return upper;
  return s;
}

export function normalizeTipDisputeStatus(
  raw: string | null | undefined
): TipDisputeStatus {
  const upper = (raw || 'NONE').trim().toUpperCase();
  if ((TIP_DISPUTE_STATUSES as readonly string[]).includes(upper)) {
    return upper as TipDisputeStatus;
  }
  return 'NONE';
}

export function isTipPending(status: string): boolean {
  return normalizeTipStatus(status) === 'PENDING';
}

export function isTipReceived(status: string): boolean {
  const n = normalizeTipStatus(status);
  return n === 'RECEIVED' || n === 'RECEIVED_UNATTRIBUTED' || n === 'SUCCEEDED';
}

export function isTipPaidOut(status: string): boolean {
  return normalizeTipStatus(status) === 'PAID_OUT';
}

export function isTipRefunded(status: string): boolean {
  return normalizeTipStatus(status) === 'REFUNDED';
}

export function receivedStatusForBeneficiary(
  beneficiaryCleanerId: string | null | undefined
): 'RECEIVED' | 'RECEIVED_UNATTRIBUTED' {
  return beneficiaryCleanerId ? 'RECEIVED' : 'RECEIVED_UNATTRIBUTED';
}

export type TipPayableInput = {
  status: string;
  beneficiaryCleanerId?: string | null;
  disputeStatus?: string | null;
  refundedAt?: Date | null;
  needsReconcile?: boolean | null;
};

/**
 * Derived PAYABLE: Stripe/admin-confirmed RECEIVED tip owed to a frozen
 * beneficiary, not refunded, not blocked by open/lost dispute.
 * PAID_OUT tips are settled (not payable). Unattributed tips are not payable.
 */
export function isTipPayable(tip: TipPayableInput): boolean {
  const status = normalizeTipStatus(tip.status);
  if (status !== 'RECEIVED') return false;
  if (!tip.beneficiaryCleanerId) return false;
  if (tip.refundedAt) return false;
  const dispute = normalizeTipDisputeStatus(tip.disputeStatus);
  if (dispute === 'OPEN' || dispute === 'LOST') return false;
  return true;
}

/** Settlement blocked for mark-paid-out when dispute is open or lost. */
export function isTipSettlementBlockedByDispute(
  disputeStatus: string | null | undefined
): boolean {
  const d = normalizeTipDisputeStatus(disputeStatus);
  return d === 'OPEN' || d === 'LOST';
}
