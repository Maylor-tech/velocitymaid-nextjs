import { describe, expect, it } from 'vitest';
import { isJobAssignable } from '@/lib/billing/billingPolicy';

describe('dispatch preserves billing assignability', () => {
  it('still allows invoice-after-service PENDING jobs to be offered', () => {
    expect(
      isJobAssignable({
        paymentStatus: 'PENDING',
        reviewStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
      })
    ).toBe(true);
  });

  it('still blocks PREPAY unpaid jobs', () => {
    expect(
      isJobAssignable({
        paymentStatus: 'PENDING',
        billingPolicy: 'PREPAY',
      })
    ).toBe(false);
  });
});
