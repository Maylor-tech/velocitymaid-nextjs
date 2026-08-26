import { describe, expect, it } from 'vitest';
import { canShowPayBalance } from '../payBalanceVisibility';

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
