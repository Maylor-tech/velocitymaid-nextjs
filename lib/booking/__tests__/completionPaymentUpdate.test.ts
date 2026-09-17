import { describe, it, expect } from 'vitest';
import { PaymentStatus } from '@prisma/client';
import { resolveCompletionPaymentUpdate } from '@/lib/booking/jobPayment';
import { canShowPayBalance } from '@/lib/booking/payBalanceVisibility';

describe('resolveCompletionPaymentUpdate (Phase 7B deposit completion)', () => {
  const job = {
    quotedTotal: 265,
    totalPrice: 265,
    amountPaid: 25,
  };

  it('deposit paid + completion -> BALANCE_DUE with remaining balance', () => {
    const update = resolveCompletionPaymentUpdate(
      PaymentStatus.DEPOSIT_PAID,
      job
    );
    expect(update).toEqual({
      paymentStatus: PaymentStatus.BALANCE_DUE,
      balanceDue: 240,
    });
    expect(
      canShowPayBalance({
        status: 'COMPLETED',
        paymentStatus: update!.paymentStatus,
        balanceDue: update!.balanceDue,
        billingPolicy: 'PREPAY',
      })
    ).toBe(true);
  });

  it('already PAID (full prepay) -> no payment-status change', () => {
    expect(
      resolveCompletionPaymentUpdate(PaymentStatus.PAID, {
        quotedTotal: 265,
        totalPrice: 265,
        amountPaid: 265,
      })
    ).toBeNull();
  });

  it('no balance remaining -> PAID (deposit covered full quote)', () => {
    const update = resolveCompletionPaymentUpdate(PaymentStatus.DEPOSIT_PAID, {
      quotedTotal: 25,
      totalPrice: 25,
      amountPaid: 25,
    });
    expect(update).toEqual({
      paymentStatus: PaymentStatus.PAID,
      balanceDue: 0,
    });
    expect(
      canShowPayBalance({
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        balanceDue: 0,
        billingPolicy: 'PREPAY',
      })
    ).toBe(false);
  });

  it('duplicate completion remains safe: BALANCE_DUE does not re-transition', () => {
    expect(
      resolveCompletionPaymentUpdate(PaymentStatus.BALANCE_DUE, job)
    ).toBeNull();
  });

  it('invoice-after-service PENDING path unaffected', () => {
    expect(
      resolveCompletionPaymentUpdate(PaymentStatus.PENDING, {
        quotedTotal: 265,
        totalPrice: 265,
        amountPaid: null,
      })
    ).toBeNull();
  });

  it('does not downgrade when payout already PAID', () => {
    expect(
      resolveCompletionPaymentUpdate(PaymentStatus.DEPOSIT_PAID, job, {
        payoutStatus: 'PAID',
      })
    ).toBeNull();
  });
});
