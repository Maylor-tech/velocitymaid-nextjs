import { describe, expect, it } from 'vitest';
import {
  isJobAssignable,
  paymentStatusLabel,
  resolveBillingPolicy,
  serviceStatusLabel,
} from '../billingPolicy';

describe('resolveBillingPolicy', () => {
  it('prefers Job snapshot over Property and Customer', () => {
    expect(
      resolveBillingPolicy({
        jobPolicy: 'PREPAY',
        propertyPolicy: 'INVOICE_AFTER_SERVICE',
        customerPolicy: 'INVOICE_AFTER_SERVICE',
      })
    ).toBe('PREPAY');
  });

  it('inherits Property then Customer, defaulting to PREPAY', () => {
    expect(
      resolveBillingPolicy({
        customerPolicy: 'INVOICE_AFTER_SERVICE',
      })
    ).toBe('INVOICE_AFTER_SERVICE');
    expect(resolveBillingPolicy({})).toBe('PREPAY');
  });
});

describe('isJobAssignable', () => {
  it('allows assignment for authorized invoice-after-service Jobs without marking them paid', () => {
    expect(
      isJobAssignable({
        paymentStatus: 'PENDING',
        reviewStatus: 'PENDING',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
      })
    ).toBe(true);
  });

  it('keeps PREPAY payment controls intact', () => {
    expect(
      isJobAssignable({
        paymentStatus: 'PENDING',
        reviewStatus: 'PENDING',
        billingPolicy: 'PREPAY',
      })
    ).toBe(false);
    expect(
      isJobAssignable({
        paymentStatus: 'DEPOSIT_PAID',
        reviewStatus: 'PENDING',
        billingPolicy: 'PREPAY',
      })
    ).toBe(false);
    expect(
      isJobAssignable({
        paymentStatus: 'DEPOSIT_PAID',
        reviewStatus: 'APPROVED',
        billingPolicy: 'PREPAY',
      })
    ).toBe(true);
    expect(
      isJobAssignable({
        paymentStatus: 'PAID',
        billingPolicy: 'PREPAY',
      })
    ).toBe(true);
  });
});

describe('status labels stay separate', () => {
  it('describes service and payment independently', () => {
    expect(serviceStatusLabel('RECEIVED')).toBe('Request received');
    expect(serviceStatusLabel('CONFIRMED')).toBe('Confirmed');
    expect(serviceStatusLabel('ASSIGNED')).toBe('Team assigned');
    expect(paymentStatusLabel('PENDING', 'INVOICE_AFTER_SERVICE')).toBe(
      'Invoice after service'
    );
    expect(paymentStatusLabel('PENDING', 'PREPAY')).toBe('Payment required');
    expect(paymentStatusLabel('PAID', 'INVOICE_AFTER_SERVICE')).toBe('Paid');
  });
});
