/**
 * Payment processing cost protection (internal cost input → customer price).
 *
 * Contract:
 * - operationalSubtotal = economics / cleaner payout base
 * - customerPrice = amount charged (Job.totalPrice / quotedTotal)
 * - processingAllowanceEstimated = customerPrice − operationalSubtotal
 *
 * Not a customer surcharge line item. Rates come from config — never hard-code
 * PayPal/Stripe brand rates into this module.
 */
import { centsToDollars, dollarsToCents, roundMoney } from './money';

export type ProcessingProtectionInput = {
  /** Assembled operational subtotal in dollars (after travel/add-ons/discounts). */
  operationalSubtotal: number;
  /** e.g. 0.0349 for 3.49%. Use 0 for pass-through of rate portion. */
  percentageRate: number;
  /** Fixed fee in dollars, e.g. 0.49 */
  fixedFee: number;
  /** Customer-facing rounding increment in dollars, e.g. 5 */
  roundingIncrement: number;
};

export type ProcessingProtectionResult = {
  operationalSubtotal: number;
  rawProtected: number;
  customerPrice: number;
  processingAllowanceEstimated: number;
  /** Informational: customerPrice − (customerPrice * rate + fixed) */
  estimatedNetAfterProcessing: number;
};

/**
 * Gross-up then ceil to the next rounding increment (default $5).
 * Exact multiples of the increment are left unchanged.
 */
export function applyProcessingProtection(
  input: ProcessingProtectionInput
): ProcessingProtectionResult {
  const operationalCents = dollarsToCents(input.operationalSubtotal);
  const fixedCents = dollarsToCents(input.fixedFee);
  const incrementCents = Math.max(1, dollarsToCents(input.roundingIncrement));

  const rate = Number.isFinite(input.percentageRate) ? input.percentageRate : 0;
  if (rate < 0 || rate >= 1) {
    throw new Error('processing percentageRate must be >= 0 and < 1');
  }

  const operationalDollars = centsToDollars(operationalCents);

  // Pass-through when rate and fixed are zero
  if (rate === 0 && fixedCents === 0) {
    const customerPrice = roundMoney(operationalDollars);
    return {
      operationalSubtotal: customerPrice,
      rawProtected: customerPrice,
      customerPrice,
      processingAllowanceEstimated: 0,
      estimatedNetAfterProcessing: customerPrice,
    };
  }

  // rate as millionths for integer division: 0.0349 → 34900
  const rateMillionths = Math.round(rate * 1_000_000);
  const denom = 1_000_000 - rateMillionths;
  if (denom <= 0) {
    throw new Error('processing percentageRate too large');
  }

  const numeratorCents = operationalCents + fixedCents;
  // rawCents = ceil(numerator / (1 - rate))
  const rawCents = Math.ceil((numeratorCents * 1_000_000) / denom);

  // Ceil to increment; exact boundary stays put
  const customerCents = Math.ceil(rawCents / incrementCents) * incrementCents;

  const rawProtected = centsToDollars(rawCents);
  const customerPrice = centsToDollars(customerCents);
  const processingAllowanceEstimated = roundMoney(customerPrice - operationalDollars);

  // Informational estimate of net if actual fee ≈ rate*customer + fixed
  const estimatedFeeCents = Math.round(customerCents * rate) + fixedCents;
  const estimatedNetAfterProcessing = centsToDollars(
    Math.max(0, customerCents - estimatedFeeCents)
  );

  return {
    operationalSubtotal: operationalDollars,
    rawProtected,
    customerPrice,
    processingAllowanceEstimated,
    estimatedNetAfterProcessing,
  };
}

/** Ceil dollars to the next increment (exported for unit tests). */
export function ceilToIncrementDollars(amount: number, incrementDollars: number): number {
  const cents = dollarsToCents(amount);
  const inc = Math.max(1, dollarsToCents(incrementDollars));
  return centsToDollars(Math.ceil(cents / inc) * inc);
}
