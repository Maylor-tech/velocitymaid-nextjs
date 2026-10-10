import { describe, expect, it } from 'vitest';
import { assertCapturedDepositPaymentIntentSnapshot } from '../assertCapturedDepositPaymentIntent';
import { ELIZABETH_K_PHASE2 } from '@/lib/billing/elizabethKPhase2';

const basePi = {
  id: ELIZABETH_K_PHASE2.paymentIntentId,
  status: 'succeeded',
  amount: 2500,
  amount_received: 2500,
  currency: 'usd',
  metadata: {
    jobId: ELIZABETH_K_PHASE2.jobId,
    customerId: ELIZABETH_K_PHASE2.customerId,
  },
};

const expected = {
  paymentIntentId: ELIZABETH_K_PHASE2.paymentIntentId,
  amountDollars: 25,
  currency: 'usd',
  jobId: ELIZABETH_K_PHASE2.jobId,
  customerId: ELIZABETH_K_PHASE2.customerId,
};

describe('assertCapturedDepositPaymentIntentSnapshot', () => {
  it('accepts the captured $25 USD PI for this job', () => {
    expect(() => assertCapturedDepositPaymentIntentSnapshot(basePi, expected)).not.toThrow();
  });

  it('rejects uncaptured, wrong amount, currency, or ownership metadata', () => {
    expect(() =>
      assertCapturedDepositPaymentIntentSnapshot({ ...basePi, status: 'requires_capture' }, expected)
    ).toThrow(/not a captured/);
    expect(() =>
      assertCapturedDepositPaymentIntentSnapshot({ ...basePi, amount_received: 40000 }, expected)
    ).toThrow(/expected 2500/);
    expect(() =>
      assertCapturedDepositPaymentIntentSnapshot({ ...basePi, currency: 'cad' }, expected)
    ).toThrow(/currency/);
    expect(() =>
      assertCapturedDepositPaymentIntentSnapshot(
        { ...basePi, metadata: { ...basePi.metadata, jobId: 'other-job' } },
        expected
      )
    ).toThrow(/jobId/);
  });
});
