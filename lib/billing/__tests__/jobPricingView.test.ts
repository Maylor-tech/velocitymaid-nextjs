import { describe, expect, it } from 'vitest';
import { jobToAdminPricingView } from '@/lib/billing/jobPricingView';

describe('jobToAdminPricingView', () => {
  it('maps quotedTotal and promo columns onto the admin pricing contract', () => {
    const view = jobToAdminPricingView({
      id: 'job-1',
      status: 'CONFIRMED',
      totalPrice: '240.00',
      quotedTotal: '250.00',
      promoDiscount: '10.00',
      promoApplied: 'host courtesy',
      currency: 'USD',
      serviceType: 'turnover',
      pricingPolicyVersion: 'pp-v1',
    });

    expect(view.totalPrice).toBe(240);
    expect(view.basePrice).toBe(250);
    expect(view.discountAmount).toBe(10);
    expect(view.discountReason).toBe('host courtesy');
    expect(view.pricingReferenceId).toBe('pp-v1');
    expect(view.modifiers).toBeNull();
    expect(view.fees).toBeNull();
    expect(view.tax).toBeNull();
    expect(view.priceLockedAt).toBeNull();
    expect(view.isLocked).toBe(false);
  });

  it('treats missing money columns as unlocked nulls, not as a lock', () => {
    const view = jobToAdminPricingView({
      id: 'job-2',
      status: 'RECEIVED',
      totalPrice: null,
      quotedTotal: null,
      promoDiscount: null,
      promoApplied: null,
      currency: null,
      serviceType: null,
      pricingPolicyVersion: null,
    });

    expect(view.totalPrice).toBeNull();
    expect(view.basePrice).toBeNull();
    expect(view.isLocked).toBe(false);
  });
});
