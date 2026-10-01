import { describe, expect, it } from 'vitest';
import {
  FAST_ESTIMATE_TIME_SLOT,
  ESTIMATE_RANGE_LABEL,
  buildEstimateRange,
  buildQuoteInputForEstimate,
  fastEstimateDate,
  isPublicPricingAllowed,
  toEstimateRange,
} from '@/lib/estimate/fastEstimate';

describe('isPublicPricingAllowed', () => {
  it('allows public pricing for Vermont branches', () => {
    expect(isPublicPricingAllowed('vermont')).toBe(true);
    expect(isPublicPricingAllowed('vermont-middlebury')).toBe(true);
    expect(isPublicPricingAllowed('port-antonio')).toBe(true);
  });

  it('hides pricing for New Jersey (quote-first) and unknown areas', () => {
    expect(isPublicPricingAllowed('new-jersey')).toBe(false);
    expect(isPublicPricingAllowed(null)).toBe(false);
    expect(isPublicPricingAllowed(undefined)).toBe(false);
    expect(isPublicPricingAllowed('')).toBe(false);
  });
});

describe('fastEstimateDate', () => {
  it('returns an ISO date 7 days out (schedule is placeholder, not price-affecting)', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    expect(fastEstimateDate(now)).toBe('2026-01-08');
  });
});

describe('buildQuoteInputForEstimate', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('maps minimal inputs and injects a valid default schedule', () => {
    const input = buildQuoteInputForEstimate(
      {
        branchSlug: 'vermont',
        serviceType: 'DEEP_CLEAN',
        bedrooms: 3,
        bathrooms: 2,
        pets: true,
      },
      now
    );
    expect(input.branchSlug).toBe('vermont');
    expect(input.serviceType).toBe('DEEP_CLEAN');
    expect(input.home).toEqual({ bedrooms: 3, bathrooms: 2, sqft: null, pets: true });
    expect(input.schedule.date).toBe('2026-01-08');
    expect(input.schedule.timeSlot).toBe(FAST_ESTIMATE_TIME_SLOT);
    expect(Object.values(input.extras).every((v) => v === false || v === '')).toBe(
      true
    );
  });

  it('only carries frequency for RECURRING service', () => {
    const recurring = buildQuoteInputForEstimate(
      {
        branchSlug: 'new-jersey',
        serviceType: 'RECURRING',
        bedrooms: 2,
        bathrooms: 1,
        frequency: 'BIWEEKLY',
      },
      now
    );
    expect(recurring.frequency).toBe('BIWEEKLY');

    const oneTime = buildQuoteInputForEstimate(
      {
        branchSlug: 'new-jersey',
        serviceType: 'DEEP_CLEAN',
        bedrooms: 2,
        bathrooms: 1,
        frequency: 'BIWEEKLY',
      },
      now
    );
    expect(oneTime.frequency).toBeNull();
  });
});

describe('buildEstimateRange', () => {
  it('builds a tidy band around the total', () => {
    const r = buildEstimateRange(200, 'USD');
    expect(r.low).toBe(180);
    expect(r.high).toBe(220);
    expect(r.currency).toBe('USD');
  });

  it('rounds to tidy $5 steps and keeps low < high', () => {
    const r = buildEstimateRange(203);
    expect(r.low).toBe(180);
    expect(r.high).toBe(225);
    expect(r.low).toBeLessThan(r.high);
  });

  it('produces stable low/high for the same input (pure, deterministic)', () => {
    expect(buildEstimateRange(417)).toEqual(buildEstimateRange(417));
    expect(buildEstimateRange(417).low).toBe(buildEstimateRange(417).low);
  });

  it('always labels the result as an estimate — never a quote/final/invoice', () => {
    const r = buildEstimateRange(250);
    expect(r.label).toBe(ESTIMATE_RANGE_LABEL);
    expect(r.label.toLowerCase()).toContain('estimate');
    expect(r.label.toLowerCase()).not.toContain('invoice');
    // Must read as not-yet-final.
    expect(r.label.toLowerCase()).toContain('final price confirmed');
  });

  it('keeps the production quote total inside the presented band (never alters it)', () => {
    for (const total of [120, 203, 315, 480, 1234]) {
      const r = buildEstimateRange(total);
      expect(r.low).toBeLessThanOrEqual(total);
      expect(r.high).toBeGreaterThanOrEqual(total);
    }
  });

  it('fails safe on invalid inputs (NaN, negative, Infinity) — no payable, no NaN', () => {
    for (const bad of [NaN, -50, Infinity, -Infinity]) {
      const r = buildEstimateRange(bad as number);
      expect(Number.isFinite(r.low)).toBe(true);
      expect(Number.isFinite(r.high)).toBe(true);
      expect(r.low).toBeGreaterThanOrEqual(0);
      expect(r.high).toBeGreaterThan(r.low);
    }
  });

  it('toEstimateRange is a back-compat alias for buildEstimateRange', () => {
    expect(toEstimateRange).toBe(buildEstimateRange);
    expect(toEstimateRange(200)).toEqual(buildEstimateRange(200));
  });
});
