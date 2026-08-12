import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUniqueSettings: vi.fn(),
  findUniqueBranch: vi.fn(),
  findFirstPackage: vi.fn(),
}));

vi.mock('../../prisma', () => ({
  prisma: {
    branch: {
      findUnique: (...a: unknown[]) => mocks.findUniqueBranch(...a),
    },
    branchServicePackage: {
      findFirst: (...a: unknown[]) => mocks.findFirstPackage(...a),
    },
    adminPlatformSettings: {
      findUnique: (...a: unknown[]) => mocks.findUniqueSettings(...a),
    },
  },
}));

import { calculateBookingQuoteAsync } from '../calculateQuote';

describe('booking quote with processing protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueBranch.mockResolvedValue({
      id: 'branch-vt',
      slug: 'vermont',
      currency: 'USD',
      PricingModel: { baseRate: '120', extraHourRate: '30', minHours: null },
    });
    mocks.findFirstPackage.mockResolvedValue({
      branchId: 'branch-vt',
      code: 'DEEP_CLEAN',
      basePrice: '300',
      isActive: true,
    });
  });

  it('booking quote protected total when enabled', async () => {
    mocks.findUniqueSettings.mockResolvedValue({
      processingProtectionEnabled: true,
      processingPercentageRate: '0.0349',
      processingFixedFee: '0.49',
      processingRoundingIncrement: 5,
      processingPolicyVersion: 'pp-v1',
    });

    const { quote, errors } = await calculateBookingQuoteAsync({
      serviceType: 'DEEP_CLEAN',
      branchSlug: 'vermont',
      home: { bedrooms: 1, bathrooms: 1 },
      schedule: { date: '2026-09-01', timeSlot: '09:00-12:00' },
      extras: {
        insideFridge: false,
        insideOven: false,
        insideCabinets: false,
        windows: false,
        laundry: false,
      },
    });

    expect(errors).toEqual([]);
    expect(quote).toBeTruthy();
    // base 300 + travel 15 = 315 operational
    expect(quote!.operationalTotal).toBe(315);
    expect(quote!.total).toBeGreaterThan(315);
    expect(quote!.total % 5).toBe(0);
    expect(quote!.pricingPolicyVersion).toBe('pp-v1');
    expect(quote!.lineItems.some((i) => /paypal|stripe|surcharge|processing fee/i.test(i.label))).toBe(
      false
    );
  });

  it('feature flag OFF golden-path: customer total equals operational', async () => {
    mocks.findUniqueSettings.mockResolvedValue({
      processingProtectionEnabled: false,
      processingPercentageRate: null,
      processingFixedFee: null,
      processingRoundingIncrement: 5,
      processingPolicyVersion: null,
    });

    const { quote } = await calculateBookingQuoteAsync({
      serviceType: 'DEEP_CLEAN',
      branchSlug: 'vermont',
      home: { bedrooms: 1, bathrooms: 1 },
      schedule: { date: '2026-09-01', timeSlot: '09:00-12:00' },
      extras: {
        insideFridge: false,
        insideOven: false,
        insideCabinets: false,
        windows: false,
        laundry: false,
      },
    });

    expect(quote!.operationalTotal).toBe(315);
    expect(quote!.total).toBe(315);
    expect(quote!.processingAllowanceEstimated).toBe(0);
    expect(quote!.pricingPolicyVersion).toBeNull();
    expect(
      quote!.warnings.some((w) => /processing protection/i.test(w))
    ).toBe(false);
  });
});
