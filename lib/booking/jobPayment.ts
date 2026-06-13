import type Stripe from 'stripe';
import { JobReviewStatus, PaymentStatus } from '@prisma/client';
import { getBookingDepositDollars } from './paymentConfig';

export function isJobAssignable(job: {
  paymentStatus: PaymentStatus;
  reviewStatus?: JobReviewStatus | null;
}): boolean {
  if (job.paymentStatus === PaymentStatus.PAID) {
    return true;
  }
  if (
    job.paymentStatus === PaymentStatus.DEPOSIT_PAID &&
    job.reviewStatus === JobReviewStatus.APPROVED
  ) {
    return true;
  }
  return false;
}

export function hasDepositPaid(job: { paymentStatus: PaymentStatus }): boolean {
  return (
    job.paymentStatus === PaymentStatus.DEPOSIT_PAID ||
    job.paymentStatus === PaymentStatus.BALANCE_DUE ||
    job.paymentStatus === PaymentStatus.PAID
  );
}

type JobPaymentFields = {
  quotedTotal: number | null;
  totalPrice: number | null;
  depositAmount: number | null;
  amountPaid: number | null;
  balanceDue: number | null;
  paymentStatus: PaymentStatus;
  reviewStatus: JobReviewStatus;
  depositPaidAt: Date | null;
  depositPaymentIntentId: string | null;
};

export function computeJobPaymentFromSession(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
): JobPaymentFields {
  const paymentType = metadata.paymentType || 'full';
  const amountCharged = session.amount_total ? session.amount_total / 100 : 0;
  const quotedTotal = metadata.quotedTotal
    ? parseFloat(metadata.quotedTotal)
    : amountCharged;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;

  if (paymentType === 'deposit') {
    const depositAmount = metadata.depositAmount
      ? parseFloat(metadata.depositAmount)
      : getBookingDepositDollars();

    return {
      quotedTotal,
      totalPrice: quotedTotal,
      depositAmount,
      amountPaid: amountCharged,
      balanceDue: Math.max(0, quotedTotal - amountCharged),
      paymentStatus: PaymentStatus.DEPOSIT_PAID,
      reviewStatus: JobReviewStatus.PENDING,
      depositPaidAt: new Date(),
      depositPaymentIntentId: paymentIntentId,
    };
  }

  if (paymentType === 'balance') {
    const existingPaid = metadata.amountPaidBefore
      ? parseFloat(metadata.amountPaidBefore)
      : 0;
    const newAmountPaid = existingPaid + amountCharged;

    return {
      quotedTotal,
      totalPrice: quotedTotal,
      depositAmount: metadata.depositAmount
        ? parseFloat(metadata.depositAmount)
        : getBookingDepositDollars(),
      amountPaid: newAmountPaid,
      balanceDue: 0,
      paymentStatus: PaymentStatus.PAID,
      reviewStatus: JobReviewStatus.APPROVED,
      depositPaidAt: null,
      depositPaymentIntentId: null,
    };
  }

  return {
    quotedTotal: amountCharged,
    totalPrice: amountCharged,
    depositAmount: null,
    amountPaid: amountCharged,
    balanceDue: 0,
    paymentStatus: PaymentStatus.PAID,
    reviewStatus: JobReviewStatus.APPROVED,
    depositPaidAt: null,
    depositPaymentIntentId: paymentIntentId,
  };
}

export function computeBalanceDueAfterCompletion(job: {
  quotedTotal: number | null;
  totalPrice: number | null;
  amountPaid: number | null;
}): number {
  const quoted = job.quotedTotal ?? job.totalPrice ?? 0;
  const paid = job.amountPaid ?? 0;
  return Math.max(0, Math.round((quoted - paid) * 100) / 100);
}

/**
 * On cleaner/admin completion, only DEPOSIT_PAID may transition to BALANCE_DUE.
 * Never downgrade PAID (or jobs with a PAID payout) back to BALANCE_DUE.
 */
export function shouldTransitionDepositToBalanceDue(
  paymentStatus: PaymentStatus
): boolean {
  return paymentStatus === PaymentStatus.DEPOSIT_PAID;
}

export type CompletionPaymentFields = {
  quotedTotal: number | null;
  totalPrice: number | null;
  amountPaid: number | null;
};

/**
 * Payment fields to apply when marking a job COMPLETED.
 * Returns null when payment status must not change (already PAID, payout PAID, etc.).
 */
export function resolveCompletionPaymentUpdate(
  paymentStatus: PaymentStatus,
  job: CompletionPaymentFields,
  options?: { payoutStatus?: string | null }
): { paymentStatus: PaymentStatus.BALANCE_DUE; balanceDue: number } | null {
  if (paymentStatus === PaymentStatus.PAID) {
    return null;
  }
  if (options?.payoutStatus === 'PAID') {
    return null;
  }
  if (!shouldTransitionDepositToBalanceDue(paymentStatus)) {
    return null;
  }
  return {
    paymentStatus: PaymentStatus.BALANCE_DUE,
    balanceDue: computeBalanceDueAfterCompletion(job),
  };
}

export function formatPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.DEPOSIT_PAID:
      return 'Deposit Paid';
    case PaymentStatus.BALANCE_DUE:
      return 'Balance Due';
    case PaymentStatus.PAID:
      return 'Paid';
    case PaymentStatus.REFUNDED:
      return 'Refunded';
    case PaymentStatus.FAILED:
      return 'Failed';
    default:
      return 'Pending';
  }
}
