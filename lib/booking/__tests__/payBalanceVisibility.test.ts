import { describe, expect, it } from 'vitest';
import { canShowPayBalance, canShowInvoicePay } from '../payBalanceVisibility';

describe('canShowPayBalance', () => {
  it('hides Stripe pay-balance for invoice-after-service Jobs', () => {
    expect(
      canShowPayBalance({
        status: 'COMPLETED',
        paymentStatus: 'BALANCE_DUE',
        balanceDue: 300,
        billingPolicy: 'INVOICE_AFTER_SERVICE',
      })
    ).toBe(false);
  });

  it('shows invoice pay for completed invoice-after jobs with a pay URL', () => {
    expect(
      canShowInvoicePay({
        status: 'COMPLETED',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        paymentStatus: 'PENDING',
        invoicePayUrl: '/invoice/tok',
      })
    ).toBe(true);
  });

  it('hides invoice pay when the job is already PAID', () => {
    expect(
      canShowInvoicePay({
        status: 'COMPLETED',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        paymentStatus: 'PAID',
        invoicePayUrl: '/invoice/tok',
      })
    ).toBe(false);
  });

  it('still shows pay-balance for PREPAY completed jobs with a balance', () => {
    expect(
      canShowPayBalance({
        status: 'COMPLETED',
        paymentStatus: 'BALANCE_DUE',
        balanceDue: 150,
        billingPolicy: 'PREPAY',
      })
    ).toBe(true);
  });
});
