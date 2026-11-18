import { describe, expect, it } from 'vitest';
import { CLEANER_SHARE } from '@/lib/payoutRules';
import { CompensationRequiredError } from '@/lib/dispatch/compensation';
import {
  defaultCleanerDurationMins,
  defaultCleanerOfferPay,
  resolvePayOverrideReason,
} from '@/lib/dispatch/cleanerOfferDefaults';

describe('default cleaner offer pay', () => {
  it('uses 65% of the agreed price, else totalPrice, rounded to the cent', () => {
    expect(CLEANER_SHARE).toBe(0.65);
    expect(defaultCleanerOfferPay({ agreedCustomerPrice: 390, totalPrice: 195 })).toBe(253.5);
    expect(defaultCleanerOfferPay({ agreedCustomerPrice: null, totalPrice: 195 })).toBe(126.75);
    expect(defaultCleanerOfferPay({ totalPrice: 390 })).toBe(253.5);
    expect(defaultCleanerOfferPay({ agreedCustomerPrice: null, totalPrice: null })).toBeNull();
  });

  it('saves no reason when pay matches the default', () => {
    expect(
      resolvePayOverrideReason({ amount: 253.5, defaultPay: 253.5, reason: 'ignored' })
    ).toBeNull();
  });

  it('requires a reason when pay is not the default', () => {
    expect(() =>
      resolvePayOverrideReason({ amount: 200, defaultPay: 253.5, reason: '  ' })
    ).toThrow(CompensationRequiredError);
    expect(
      resolvePayOverrideReason({
        amount: 200,
        defaultPay: 253.5,
        reason: ' Second cleaner already booked ',
      })
    ).toBe('Second cleaner already booked');
  });
});

describe('default cleaner duration', () => {
  it('uses bedroom hours and splits them across the crew', () => {
    expect(defaultCleanerDurationMins({ bedrooms: 2 })).toBe(180);
    expect(defaultCleanerDurationMins({ bedrooms: 3 })).toBe(300);
    expect(defaultCleanerDurationMins({ bedrooms: 4 })).toBe(360);
    expect(defaultCleanerDurationMins({ bedrooms: 4, largeFourBedroom: true })).toBe(420);
    expect(defaultCleanerDurationMins({ bedrooms: 4, cleanerCount: 2 })).toBe(180);
    expect(defaultCleanerDurationMins({ bedrooms: 1 })).toBeNull();
  });
});