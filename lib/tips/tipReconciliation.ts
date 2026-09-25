import {
  isTipPayable,
  isTipPending,
  isTipPaidOut,
  isTipReceived,
  normalizeTipDisputeStatus,
  normalizeTipStatus,
  type TipReconcileReason,
} from '@/lib/tips/statuses';

export type TipReconFlagsInput = {
  status: string;
  paymentMethod?: string | null;
  stripePaymentIntentId?: string | null;
  receivedAt?: Date | null;
  refundedAt?: Date | null;
  disputedAt?: Date | null;
  disputeStatus?: string | null;
  needsReconcile?: boolean | null;
  reconcileReason?: string | null;
  beneficiaryCleanerId?: string | null;
  paidOutAt?: Date | null;
};

export type TipReconFlags = {
  payable: boolean;
  pendingZelle: boolean;
  receivedAttributed: boolean;
  receivedUnattributed: boolean;
  paidOut: boolean;
  refunded: boolean;
  disputeOpen: boolean;
  disputeLost: boolean;
  disputeWon: boolean;
  needsReconcile: boolean;
  reconcileReason: string | null;
  possibleStripeDbMismatch: boolean;
  refundAfterPaidOut: boolean;
  disputeAfterPaidOut: boolean;
  missingBeneficiary: boolean;
};

export function buildTipReconFlags(tip: TipReconFlagsInput): TipReconFlags {
  const canonical = normalizeTipStatus(tip.status);
  const dispute = normalizeTipDisputeStatus(tip.disputeStatus);
  const paidOut = isTipPaidOut(tip.status);
  const possibleStripeDbMismatch =
    Boolean(tip.stripePaymentIntentId) &&
    isTipPending(tip.status) &&
    !tip.receivedAt;

  const refundAfterPaidOut = paidOut && tip.refundedAt != null;
  const disputeAfterPaidOut =
    paidOut && (dispute === 'OPEN' || dispute === 'LOST');

  return {
    payable: isTipPayable(tip),
    pendingZelle:
      tip.paymentMethod === 'ZELLE' &&
      (canonical === 'PENDING' || tip.status === 'pending'),
    receivedAttributed: canonical === 'RECEIVED',
    receivedUnattributed: canonical === 'RECEIVED_UNATTRIBUTED',
    paidOut,
    refunded: canonical === 'REFUNDED' || tip.refundedAt != null,
    disputeOpen: dispute === 'OPEN',
    disputeLost: dispute === 'LOST',
    disputeWon: dispute === 'WON',
    needsReconcile: Boolean(tip.needsReconcile) || possibleStripeDbMismatch,
    reconcileReason:
      tip.reconcileReason ||
      (possibleStripeDbMismatch ? 'STRIPE_SUCCEEDED_TIP_PENDING' : null),
    possibleStripeDbMismatch,
    refundAfterPaidOut,
    disputeAfterPaidOut,
    missingBeneficiary:
      isTipReceived(tip.status) && !tip.beneficiaryCleanerId,
  };
}

export function reconcileReasonLabel(reason: string | null | undefined): string {
  switch (reason as TipReconcileReason | string) {
    case 'STRIPE_SUCCEEDED_TIP_PENDING':
      return 'Stripe payment may have succeeded while tip is still PENDING';
    case 'PI_ATTACH_INCOMPLETE':
      return 'PaymentIntent exists but tip init/attach was incomplete';
    case 'REFUND_AFTER_PAID_OUT':
      return 'Refund after tip was marked PAID_OUT — ops must reconcile';
    case 'DISPUTE_AFTER_PAID_OUT':
      return 'Dispute after tip was marked PAID_OUT — ops must reconcile';
    case 'DISPUTE_LOST_AFTER_PAID_OUT':
      return 'Dispute lost after PAID_OUT — ops must reconcile';
    case 'STRIPE_LEDGER_MISMATCH':
      return 'Stripe financial state differs from tip ledger';
    case 'WEBHOOK_PROCESSING_FAILURE':
      return 'Tip webhook processing failure flagged for recon';
    default:
      return reason || 'Needs reconciliation';
  }
}
