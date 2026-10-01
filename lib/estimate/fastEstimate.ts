/**
 * Fast Estimate — pure helpers for the public instant-estimate widget.
 *
 * Policy: marketing surfaces for quote-first markets (New Jersey) must never
 * publish a dollar amount — they show "Custom quote" and route to the full
 * lead form. Public-pricing branches (Vermont, etc.) get an on-screen ballpark
 * computed by the shared booking quote engine.
 *
 * The quote engine requires a schedule (date + time slot) for validation, but
 * schedule never affects price — so we inject a deterministic default purely to
 * satisfy validation. It does not skew the estimate.
 *
 * Pure functions — safe on client and server.
 */

import type { ServiceType } from '@/components/booking/types';
import type { BookingQuoteInput } from '@/lib/pricing/types';
import { NJ_BRANCH_SLUG } from '@/lib/markets/newJersey';

/** Injected only to satisfy the quote engine's schedule validation. */
export const FAST_ESTIMATE_TIME_SLOT = '09:00-12:00';
export const FAST_ESTIMATE_LEAD_DAYS = 7;

export const CUSTOM_QUOTE_LABEL = 'Custom quote';

export interface FastEstimateParams {
  branchSlug: string | null;
  serviceType: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  pets?: boolean;
  sqft?: number | null;
  frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | null;
}

/**
 * Whether a branch may show a public dollar estimate. New Jersey is quote-first
 * (NJ_PRICING_PUBLIC_LABEL = 'Custom quote'); unknown branches default to hidden
 * so we never leak a price for an unmapped area.
 */
export function isPublicPricingAllowed(
  branchSlug: string | null | undefined
): boolean {
  if (!branchSlug) return false;
  if (branchSlug === NJ_BRANCH_SLUG) return false;
  return true;
}

/** Deterministic placeholder service date (schedule does not affect price). */
export function fastEstimateDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + FAST_ESTIMATE_LEAD_DAYS);
  return d.toISOString().slice(0, 10);
}

/** Map minimal fast-estimate inputs onto the full BookingQuoteInput shape. */
export function buildQuoteInputForEstimate(
  params: FastEstimateParams,
  now: Date = new Date()
): BookingQuoteInput {
  return {
    serviceType: params.serviceType,
    branchSlug: params.branchSlug,
    home: {
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      sqft: params.sqft ?? null,
      pets: Boolean(params.pets),
    },
    schedule: {
      date: fastEstimateDate(now),
      timeSlot: FAST_ESTIMATE_TIME_SLOT,
    },
    extras: {
      insideFridge: false,
      insideOven: false,
      insideCabinets: false,
      windows: false,
      laundry: false,
      notes: '',
    },
    promoCode: null,
    frequency:
      params.serviceType === 'RECURRING' ? params.frequency ?? null : null,
  };
}

export interface EstimateRange {
  low: number;
  high: number;
  currency: string;
}

/**
 * Marketing ballpark band around the computed total — rounded to tidy $ steps so
 * we never present false-precision single numbers before a real walkthrough.
 */
export function toEstimateRange(total: number, currency = 'USD'): EstimateRange {
  const step = 5;
  const safe = Number.isFinite(total) && total > 0 ? total : 0;
  // Round to whole dollars first so float artifacts (e.g. 200*1.1 = 220.0000003)
  // don't bump the step rounding to the next bucket.
  const low = Math.max(0, Math.floor(Math.round(safe * 0.9) / step) * step);
  const highRaw = Math.ceil(Math.round(safe * 1.1) / step) * step;
  return { low, high: highRaw > low ? highRaw : low + step, currency };
}
