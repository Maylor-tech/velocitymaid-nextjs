/**
 * Maps persisted Job money columns onto the admin pricing API shape.
 *
 * Job has never stored basePrice / modifiers / fees / tax / priceLockedAt /
 * pricingSnapshot. Those keys remain in the JSON contract as null so existing
 * admin clients keep parsing, while reads and writes use quotedTotal,
 * totalPrice, promoDiscount, and promoApplied.
 */

export type JobPricingColumns = {
  id: string;
  status: string;
  totalPrice: unknown;
  quotedTotal: unknown;
  promoDiscount: unknown;
  promoApplied: string | null;
  currency: string | null;
  serviceType: string | null;
  pricingPolicyVersion: string | null;
};

export type AdminJobPricingView = {
  id: string;
  totalPrice: number | null;
  basePrice: number | null;
  modifiers: number | null;
  fees: number | null;
  tax: number | null;
  discountAmount: number | null;
  discountReason: string | null;
  discountApprovedBy: null;
  priceLockedAt: null;
  pricingSnapshot: null;
  pricingReferenceId: string | null;
  currency: string | null;
  serviceType: string | null;
  isLocked: false;
};

function moneyOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function jobToAdminPricingView(job: JobPricingColumns): AdminJobPricingView {
  return {
    id: job.id,
    totalPrice: moneyOrNull(job.totalPrice),
    basePrice: moneyOrNull(job.quotedTotal),
    modifiers: null,
    fees: null,
    tax: null,
    discountAmount: moneyOrNull(job.promoDiscount),
    discountReason: job.promoApplied,
    discountApprovedBy: null,
    priceLockedAt: null,
    pricingSnapshot: null,
    pricingReferenceId: job.pricingPolicyVersion,
    currency: job.currency,
    serviceType: job.serviceType,
    isLocked: false,
  };
}

export const JOB_PRICING_SELECT = {
  id: true,
  status: true,
  totalPrice: true,
  quotedTotal: true,
  promoDiscount: true,
  promoApplied: true,
  currency: true,
  serviceType: true,
  pricingPolicyVersion: true,
} as const;
