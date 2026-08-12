/**
 * Regression tests for the /book pricing engine.
 *
 * Bug: getBranchServicePricingConfig() ignored serviceType entirely when a
 * branch had a PricingModel (true for every branch today), so Basic/Standard,
 * Deep Clean, Move-In/Out, and Turnover all silently priced identically.
 *
 * These test the FINAL checkout total via calculateBookingQuoteAsync() (the
 * same function app/api/booking/quote/route.ts calls), not just the internal
 * base-price lookup, and cover every service type offered in each market
 * (lib/booking/markets.ts) across several bedroom/bathroom combinations.
 *
 * Prisma is mocked with data matching the live production state confirmed
 * during the 2026-07-10 pricing audit (see task #1) — update these fixtures
 * if that data changes.
 */
import { describe, it, expect, vi } from 'vitest';

const { mockBranches, mockPackages } = vi.hoisted(() => {
  const mockBranches: Record<string, any> = {
    'new-jersey': {
      id: 'branch-nj',
      slug: 'new-jersey',
      currency: 'USD',
      PricingModel: { baseRate: '120', extraHourRate: '30', minHours: null },
    },
    vermont: {
      id: 'branch-vt',
      slug: 'vermont',
      currency: 'USD',
      PricingModel: { baseRate: '120', extraHourRate: '30', minHours: null },
    },
    'vermont-middlebury': {
      id: 'branch-vt-mb',
      slug: 'vermont-middlebury',
      currency: 'USD',
      PricingModel: { baseRate: '120', extraHourRate: '30', minHours: null },
    },
  };

  // Matches live BranchServicePackage rows as of 2026-07-11 (Emergency Clean
  // seeded per the 2026-07-11 pricing decision: $350 base + existing $75
  // rush fee). Note vermont-middlebury deliberately has ZERO rows, matching
  // the real gap found in the audit. Recurring has no row of its own — it's
  // aliased to BASIC_CLEAN in config.ts and discounted downstream.
  const mockPackages = [
    { branchId: 'branch-nj', code: 'BASIC_CLEAN', basePrice: '120', isActive: true },
    { branchId: 'branch-nj', code: 'DEEP_CLEAN', basePrice: '220', isActive: true },
    { branchId: 'branch-nj', code: 'MOVE_IN_OUT', basePrice: '320', isActive: true },
    { branchId: 'branch-vt', code: 'VACATION_RENTAL_TURNOVER', basePrice: '175', isActive: true },
    { branchId: 'branch-vt', code: 'DEEP_CLEAN', basePrice: '300', isActive: true },
    { branchId: 'branch-vt', code: 'MOVE_IN_OUT', basePrice: '450', isActive: true },
    { branchId: 'branch-vt', code: 'EMERGENCY_CLEAN', basePrice: '350', isActive: true },
  ];

  return { mockBranches, mockPackages };
});

vi.mock('../../prisma', () => ({
  prisma: {
    branch: {
      findUnique: vi.fn(async ({ where }: any) => mockBranches[where.slug] ?? null),
    },
    branchServicePackage: {
      findFirst: vi.fn(async ({ where }: any) => {
        const codes: string[] = where.code.in;
        return (
          mockPackages.find(
            (p) =>
              p.branchId === where.branchId &&
              codes.includes(p.code) &&
              p.isActive === where.isActive
          ) ?? null
        );
      }),
    },
    // Feature flag OFF — golden booking totals must remain unchanged.
    adminPlatformSettings: {
      findUnique: vi.fn(async () => ({
        processingProtectionEnabled: false,
        processingPercentageRate: null,
        processingFixedFee: null,
        processingRoundingIncrement: 5,
        processingPolicyVersion: null,
      })),
    },
  },
}));

import { calculateBookingQuoteAsync } from '../calculateQuote';
import type { BookingQuoteInput } from '../types';

function input(overrides: Partial<BookingQuoteInput> = {}): BookingQuoteInput {
  return {
    serviceType: null,
    branchSlug: null,
    home: { bedrooms: 1, bathrooms: 1, sqft: null, pets: false },
    schedule: { date: '2026-08-01', timeSlot: '09:00-12:00' },
    extras: {
      insideFridge: false,
      insideOven: false,
      insideCabinets: false,
      windows: false,
      laundry: false,
    },
    promoCode: null,
    frequency: null,
    ...overrides,
  };
}

describe('/book pricing engine — service-type base price regression', () => {
  describe('Vermont — every offered service type, 1BR/1BA', () => {
    it('Vacation Rental Turnover totals $190 ($175 base + $15 travel)', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'VACATION_RENTAL_TURNOVER', branchSlug: 'vermont' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(190);
    });

    it('Deep Clean totals $315 ($300 base + $15 travel)', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'DEEP_CLEAN', branchSlug: 'vermont' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(315);
    });

    it('Move In/Out totals $465 ($450 base + $15 travel)', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'MOVE_IN_OUT', branchSlug: 'vermont' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(465);
    });

    it('Property Walkthrough is unaffected — still a flat $75 + $15 travel = $90', async () => {
      // PROPERTY_WALKTHROUGH has no BranchServicePackage row and none is
      // expected — it's priced by its own existing override in
      // calculateQuote.ts, unrelated to this fix. This test guards against
      // that behavior regressing.
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'PROPERTY_WALKTHROUGH', branchSlug: 'vermont' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(90);
    });

    it('Emergency Clean totals $440 ($350 base + $75 rush fee + $15 travel)', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'EMERGENCY_CLEAN', branchSlug: 'vermont' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(440);
    });

    it('Emergency Clean minimum charge (base + rush fee, before travel/add-ons) is $425 per the 2026-07-11 pricing decision', async () => {
      const { quote } = await calculateBookingQuoteAsync(
        input({ serviceType: 'EMERGENCY_CLEAN', branchSlug: 'vermont' })
      );
      const base = quote?.lineItems.find((li) => li.key === 'base')?.amount ?? 0;
      const rushFee = quote?.lineItems.find((li) => li.key === 'emergency_fee')?.amount ?? 0;
      expect(base + rushFee).toBe(425);
    });

    it('the three priced Vermont tiers are all different from each other (the actual bug fix)', async () => {
      const turnover = await calculateBookingQuoteAsync(
        input({ serviceType: 'VACATION_RENTAL_TURNOVER', branchSlug: 'vermont' })
      );
      const deep = await calculateBookingQuoteAsync(
        input({ serviceType: 'DEEP_CLEAN', branchSlug: 'vermont' })
      );
      const moveInOut = await calculateBookingQuoteAsync(
        input({ serviceType: 'MOVE_IN_OUT', branchSlug: 'vermont' })
      );

      const totals = [turnover.quote?.total, deep.quote?.total, moveInOut.quote?.total];
      expect(new Set(totals).size).toBe(3); // all distinct — before the fix, all three were $135
    });
  });

  describe('New Jersey — every offered service type, 1BR/1BA', () => {
    it('Standard (aliased from legacy BASIC_CLEAN code) totals $135', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'STANDARD', branchSlug: 'new-jersey' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(135);
    });

    it('Deep Clean totals $235 ($220 base + $15 travel)', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'DEEP_CLEAN', branchSlug: 'new-jersey' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(235);
    });

    it('Move In/Out totals $335 ($320 base + $15 travel)', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'MOVE_IN_OUT', branchSlug: 'new-jersey' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(335);
    });

    it('Recurring without a frequency fails safely instead of guessing which discount to apply', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'RECURRING', branchSlug: 'new-jersey' })
      );
      expect(quote).toBeNull();
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('frequency');
      expect(errors[0].message).toMatch(/frequency/i);
    });

    describe('Recurring — priced off the Standard total (BASIC_CLEAN alias), discounted by frequency', () => {
      it('Monthly equals Standard exactly ($135) — no discount', async () => {
        const standard = await calculateBookingQuoteAsync(
          input({ serviceType: 'STANDARD', branchSlug: 'new-jersey' })
        );
        const monthly = await calculateBookingQuoteAsync(
          input({ serviceType: 'RECURRING', branchSlug: 'new-jersey', frequency: 'MONTHLY' })
        );
        expect(monthly.errors).toEqual([]);
        expect(monthly.quote?.total).toBe(standard.quote?.total);
        expect(monthly.quote?.lineItems.some((li) => li.key === 'recurring_discount')).toBe(false);
      });

      it('Bi-Weekly is 10% off the Standard total: $121.50', async () => {
        const { quote, errors } = await calculateBookingQuoteAsync(
          input({ serviceType: 'RECURRING', branchSlug: 'new-jersey', frequency: 'BIWEEKLY' })
        );
        expect(errors).toEqual([]);
        expect(quote?.total).toBe(121.5);
      });

      it('Weekly is 15% off the Standard total: $114.75', async () => {
        const { quote, errors } = await calculateBookingQuoteAsync(
          input({ serviceType: 'RECURRING', branchSlug: 'new-jersey', frequency: 'WEEKLY' })
        );
        expect(errors).toEqual([]);
        expect(quote?.total).toBe(114.75);
      });

      it('does not maintain a separate recurring price table — RECURRING and STANDARD share the same base line item amount', async () => {
        const standard = await calculateBookingQuoteAsync(
          input({ serviceType: 'STANDARD', branchSlug: 'new-jersey' })
        );
        const recurring = await calculateBookingQuoteAsync(
          input({ serviceType: 'RECURRING', branchSlug: 'new-jersey', frequency: 'WEEKLY' })
        );
        const standardBase = standard.quote?.lineItems.find((li) => li.key === 'base')?.amount;
        const recurringBase = recurring.quote?.lineItems.find((li) => li.key === 'base')?.amount;
        expect(recurringBase).toBe(standardBase);
      });
    });

    it('Standard, Deep Clean, and Move In/Out are all different from each other (the actual bug fix)', async () => {
      const standard = await calculateBookingQuoteAsync(
        input({ serviceType: 'STANDARD', branchSlug: 'new-jersey' })
      );
      const deep = await calculateBookingQuoteAsync(
        input({ serviceType: 'DEEP_CLEAN', branchSlug: 'new-jersey' })
      );
      const moveInOut = await calculateBookingQuoteAsync(
        input({ serviceType: 'MOVE_IN_OUT', branchSlug: 'new-jersey' })
      );

      const totals = [standard.quote?.total, deep.quote?.total, moveInOut.quote?.total];
      expect(new Set(totals).size).toBe(3); // all distinct — before the fix, all three were $135
    });
  });

  describe('vermont-middlebury — zero configured packages (real data gap, not invented)', () => {
    it.each([
      'VACATION_RENTAL_TURNOVER',
      'DEEP_CLEAN',
      'MOVE_IN_OUT',
      'EMERGENCY_CLEAN',
    ] as const)('%s fails safely rather than silently pricing off another branch/tier', async (serviceType) => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType, branchSlug: 'vermont-middlebury' })
      );
      expect(quote).toBeNull();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toMatch(/manual quote/i);
    });

    it('Property Walkthrough still works — priced independently of any package row', async () => {
      const { quote, errors } = await calculateBookingQuoteAsync(
        input({ serviceType: 'PROPERTY_WALKTHROUGH', branchSlug: 'vermont-middlebury' })
      );
      expect(errors).toEqual([]);
      expect(quote?.total).toBe(90);
    });
  });

  describe('the price gap between service types holds steady across bedroom/bathroom combinations', () => {
    const combos: Array<{ bedrooms: number; bathrooms: number }> = [
      { bedrooms: 1, bathrooms: 1 },
      { bedrooms: 2, bathrooms: 1 },
      { bedrooms: 3, bathrooms: 2 },
      { bedrooms: 5, bathrooms: 3 },
    ];

    it.each(combos)(
      'Vermont %j: Deep Clean is always exactly $125 more than Turnover, Move-In/Out always exactly $150 more than Deep Clean',
      async ({ bedrooms, bathrooms }) => {
        const home = { bedrooms, bathrooms, sqft: null, pets: false };
        const turnover = await calculateBookingQuoteAsync(
          input({ serviceType: 'VACATION_RENTAL_TURNOVER', branchSlug: 'vermont', home })
        );
        const deep = await calculateBookingQuoteAsync(
          input({ serviceType: 'DEEP_CLEAN', branchSlug: 'vermont', home })
        );
        const moveInOut = await calculateBookingQuoteAsync(
          input({ serviceType: 'MOVE_IN_OUT', branchSlug: 'vermont', home })
        );

        expect(deep.quote!.total - turnover.quote!.total).toBe(125); // $300 - $175
        expect(moveInOut.quote!.total - deep.quote!.total).toBe(150); // $450 - $300
      }
    );

    it.each(combos)(
      'New Jersey %j: Deep Clean is always exactly $100 more than Standard, Move-In/Out always exactly $100 more than Deep Clean',
      async ({ bedrooms, bathrooms }) => {
        const home = { bedrooms, bathrooms, sqft: null, pets: false };
        const standard = await calculateBookingQuoteAsync(
          input({ serviceType: 'STANDARD', branchSlug: 'new-jersey', home })
        );
        const deep = await calculateBookingQuoteAsync(
          input({ serviceType: 'DEEP_CLEAN', branchSlug: 'new-jersey', home })
        );
        const moveInOut = await calculateBookingQuoteAsync(
          input({ serviceType: 'MOVE_IN_OUT', branchSlug: 'new-jersey', home })
        );

        expect(deep.quote!.total - standard.quote!.total).toBe(100); // $220 - $120
        expect(moveInOut.quote!.total - deep.quote!.total).toBe(100); // $320 - $220
      }
    );
  });
});
