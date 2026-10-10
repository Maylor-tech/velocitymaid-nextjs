import { getStripe } from '@/lib/stripe';
import { roundMoney } from './invoiceUtils';
import { DepositCreditError } from './depositCreditError';

export type StripePaymentIntentSnapshot = {
  id: string;
  status: string;
  amount: number;
  amount_received?: number | null;
  currency: string;
  metadata?: Record<string, string> | null;
};

export type ExpectedDepositIntent = {
  paymentIntentId: string;
  amountDollars: number;
  currency?: string;
  jobId?: string | null;
  customerId?: string | null;
};

/** Pure checks used by creditJobDepositToInvoice. Does not create a charge. */
export function assertCapturedDepositPaymentIntentSnapshot(
  pi: StripePaymentIntentSnapshot,
  expected: ExpectedDepositIntent
): void {
  if (pi.id !== expected.paymentIntentId) {
    throw new DepositCreditError('PAYMENT_INTENT_MISMATCH', 'Retrieved PaymentIntent id does not match');
  }
  if (pi.status !== 'succeeded') {
    throw new DepositCreditError(
      'PAYMENT_INTENT_NOT_CAPTURED',
      `PaymentIntent is ${pi.status}, not a captured succeeded charge`
    );
  }

  const expectedCents = Math.round(roundMoney(expected.amountDollars) * 100);
  const received = pi.amount_received ?? pi.amount;
  if (received !== expectedCents) {
    throw new DepositCreditError(
      'PAYMENT_INTENT_AMOUNT_MISMATCH',
      `PaymentIntent captured ${received} cents; expected ${expectedCents}`
    );
  }

  const expectedCurrency = (expected.currency ?? 'usd').toLowerCase();
  if ((pi.currency || '').toLowerCase() !== expectedCurrency) {
    throw new DepositCreditError(
      'PAYMENT_INTENT_CURRENCY_MISMATCH',
      `PaymentIntent currency ${pi.currency} does not match ${expectedCurrency}`
    );
  }

  const metaJob = pi.metadata?.jobId;
  if (metaJob && expected.jobId && metaJob !== expected.jobId) {
    throw new DepositCreditError(
      'PAYMENT_INTENT_JOB_MISMATCH',
      'PaymentIntent metadata.jobId does not match the invoice job'
    );
  }

  const metaCustomer = pi.metadata?.customerId;
  if (metaCustomer && expected.customerId && metaCustomer !== expected.customerId) {
    throw new DepositCreditError(
      'PAYMENT_INTENT_CUSTOMER_MISMATCH',
      'PaymentIntent metadata.customerId does not match the invoice customer'
    );
  }
}

export async function retrieveAndAssertCapturedDepositPaymentIntent(
  expected: ExpectedDepositIntent
): Promise<StripePaymentIntentSnapshot> {
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(expected.paymentIntentId);
  const snapshot: StripePaymentIntentSnapshot = {
    id: pi.id,
    status: pi.status,
    amount: pi.amount,
    amount_received: pi.amount_received,
    currency: pi.currency,
    metadata: (pi.metadata ?? null) as Record<string, string> | null,
  };
  assertCapturedDepositPaymentIntentSnapshot(snapshot, expected);
  return snapshot;
}
