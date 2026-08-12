import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUniqueSettings: vi.fn(),
  calculateBookingQuoteAsync: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminPlatformSettings: {
      findUnique: (...a: unknown[]) => mocks.findUniqueSettings(...a),
    },
  },
}));

vi.mock('@/lib/pricing/calculateQuote', () => ({
  calculateBookingQuoteAsync: (...a: unknown[]) => mocks.calculateBookingQuoteAsync(...a),
}));

import {
  resolveAuthoritativeCheckoutQuote,
  normalizeCheckoutServiceType,
} from '../checkoutPricing';
import { protectOperationalPrice, passThroughProtectedPrice } from '@/lib/pricing/processingPolicy';

describe('processingPolicy pass-through', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disabled policy pass-through', async () => {
    mocks.findUniqueSettings.mockResolvedValue({
      processingProtectionEnabled: false,
      processingPercentageRate: 0.0349,
      processingFixedFee: 0.49,
      processingRoundingIncrement: 5,
      processingPolicyVersion: 'pp-v1',
    });
    const result = await protectOperationalPrice(350);
    expect(result.customerPrice).toBe(350);
    expect(result.processingAllowanceEstimated).toBe(0);
    expect(result.warning).toBeTruthy();
    expect(result.protected).toBe(false);
  });

  it('missing policy pass-through', async () => {
    mocks.findUniqueSettings.mockResolvedValue(null);
    const result = await protectOperationalPrice(350);
    expect(result.customerPrice).toBe(350);
    expect(result.warning).toBeTruthy();
  });

  it('passThrough helper', () => {
    const result = passThroughProtectedPrice(190);
    expect(result.customerPrice).toBe(190);
    expect(result.pricingPolicyVersion).toBeNull();
  });
});

describe('checkoutPricing verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes checkout aliases', () => {
    expect(normalizeCheckoutServiceType('deep')).toBe('DEEP_CLEAN');
    expect(normalizeCheckoutServiceType('DEEP_CLEAN')).toBe('DEEP_CLEAN');
  });

  it('checkout cannot trust manipulated client total', async () => {
    mocks.calculateBookingQuoteAsync.mockResolvedValue({
      quote: {
        total: 365,
        operationalTotal: 350,
        processingAllowanceEstimated: 15,
        pricingPolicyVersion: 'pp-v1',
        currency: 'USD',
        warnings: [],
      },
      errors: [],
    });

    const rejected = await resolveAuthoritativeCheckoutQuote({
      serviceType: 'DEEP_CLEAN',
      branchSlug: 'vermont',
      home: { bedrooms: 2, bathrooms: 1 },
      schedule: { date: '2026-09-01', timeSlot: '09:00-12:00' },
      extras: {},
      totalPrice: 999,
    });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.error).toMatch(/does not match server pricing/i);
    }
  });

  it('Stripe full-payment amount uses customer total from server quote', async () => {
    mocks.calculateBookingQuoteAsync.mockResolvedValue({
      quote: {
        total: 365,
        operationalTotal: 350,
        processingAllowanceEstimated: 15,
        pricingPolicyVersion: 'pp-v1',
        currency: 'USD',
        warnings: [],
      },
      errors: [],
    });

    const ok = await resolveAuthoritativeCheckoutQuote({
      quoteInput: {
        serviceType: 'DEEP_CLEAN',
        branchSlug: 'vermont',
        home: { bedrooms: 2, bathrooms: 1 },
        schedule: { date: '2026-09-01', timeSlot: '09:00-12:00' },
        extras: {
          insideFridge: false,
          insideOven: false,
          insideCabinets: false,
          windows: false,
          laundry: false,
        },
      },
      totalPrice: 365,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.quote.customerTotal).toBe(365);
      expect(ok.quote.operationalTotal).toBe(350);
    }
  });

  it('ignores priceInputMode on public checkout (cannot bypass protection)', async () => {
    mocks.calculateBookingQuoteAsync.mockResolvedValue({
      quote: {
        total: 365,
        operationalTotal: 350,
        processingAllowanceEstimated: 15,
        pricingPolicyVersion: 'pp-v1',
        currency: 'USD',
        warnings: [],
      },
      errors: [],
    });

    const ok = await resolveAuthoritativeCheckoutQuote({
      serviceType: 'DEEP_CLEAN',
      branchSlug: 'vermont',
      home: { bedrooms: 1, bathrooms: 1 },
      schedule: { date: '2026-09-01', timeSlot: '09:00-12:00' },
      extras: {},
      totalPrice: 365,
      // Attempted bypass — must not change authoritative server quote
      priceInputMode: 'customer',
    });
    expect(ok.ok).toBe(true);
    expect(mocks.calculateBookingQuoteAsync).toHaveBeenCalled();
    const input = mocks.calculateBookingQuoteAsync.mock.calls[0][0];
    expect(input).not.toHaveProperty('priceInputMode');
    if (ok.ok) {
      expect(ok.quote.customerTotal).toBe(365);
      expect(ok.quote.operationalTotal).toBe(350);
    }
  });
});
