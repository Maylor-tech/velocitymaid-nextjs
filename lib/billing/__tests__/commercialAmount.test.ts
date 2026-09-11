import { describe, expect, it } from 'vitest';
import {
  CommercialAmountRequiredError,
  formatCommercialMoney,
  moneyOrNull,
  requireCommercialAmount,
  resolveCommercialAmount,
  resolveDepositMilestone,
  resolveDepositPaidDisplay,
} from '@/lib/billing/commercialAmount';

describe('commercialAmount', () => {
  it('distinguishes null/unknown from a real zero amount', () => {
    expect(moneyOrNull(null)).toBeNull();
    expect(moneyOrNull(undefined)).toBeNull();
    expect(moneyOrNull('')).toBeNull();
    expect(moneyOrNull(0)).toBe(0);
    expect(moneyOrNull('0')).toBe(0);
    expect(moneyOrNull(125.5)).toBe(125.5);
  });

  it('prefers totalPrice over quotedTotal and never coerces missing to 0', () => {
    expect(resolveCommercialAmount({ totalPrice: null, quotedTotal: null })).toBeNull();
    expect(resolveCommercialAmount({ totalPrice: 0, quotedTotal: 200 })).toBe(0);
    expect(resolveCommercialAmount({ totalPrice: null, quotedTotal: 250 })).toBe(250);
    expect(resolveCommercialAmount({ totalPrice: 300, quotedTotal: 250 })).toBe(300);
  });

  it('requireCommercialAmount throws when pricing is missing', () => {
    expect(() =>
      requireCommercialAmount({ totalPrice: null, quotedTotal: null })
    ).toThrow(CommercialAmountRequiredError);
    expect(requireCommercialAmount({ totalPrice: 0, quotedTotal: null })).toBe(0);
  });

  it('formats missing money as Not set, and real zero as $0.00', () => {
    expect(formatCommercialMoney(null)).toBe('Not set');
    expect(formatCommercialMoney(0)).toBe('$0.00');
    expect(formatCommercialMoney(180)).toBe('$180.00');
  });

  it('marks deposit not required for invoice-after-service without a collected deposit', () => {
    const milestone = resolveDepositMilestone({
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      paymentStatus: 'PENDING',
    });
    expect(milestone.label).toBe('Deposit not required');
    expect(milestone.satisfied).toBe(true);

    const display = resolveDepositPaidDisplay({
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      paymentStatus: 'PENDING',
      depositAmount: null,
      amountPaid: null,
    });
    expect(display.kind).toBe('not_required');
    expect(display.label).toBe('Not required');
  });

  it('requires a real deposit for PREPAY until payment clears', () => {
    const pending = resolveDepositMilestone({
      billingPolicy: 'PREPAY',
      paymentStatus: 'PENDING',
    });
    expect(pending.label).toBe('Deposit paid');
    expect(pending.satisfied).toBe(false);

    const paid = resolveDepositMilestone({
      billingPolicy: 'PREPAY',
      paymentStatus: 'DEPOSIT_PAID',
    });
    expect(paid.satisfied).toBe(true);
  });
});
