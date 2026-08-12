/**
 * Checkout must recompute authoritative quote from booking inputs.
 * Client totalPrice is verified, not trusted for Stripe charge amount.
 *
 * Security: `priceInputMode` is NOT accepted here. Customer-price override
 * exists only on ADMIN create-manual (`requireRole ADMIN`). Public booking
 * always runs calculateBookingQuoteAsync → protectOperationalPrice.
 */
import type { BookingQuoteInput } from '@/lib/pricing/types';
import { calculateBookingQuoteAsync } from '@/lib/pricing/calculateQuote';
import { dollarsToCents } from '@/lib/pricing/money';

const ENGINE_SERVICE_TYPES = new Set([
  'STANDARD',
  'DEEP_CLEAN',
  'MOVE_IN_OUT',
  'RECURRING',
  'VACATION_RENTAL_TURNOVER',
  'PROPERTY_WALKTHROUGH',
  'EMERGENCY_CLEAN',
]);

/** Map legacy checkout aliases → engine service types. */
const CHECKOUT_SERVICE_ALIASES: Record<string, string> = {
  basic: 'STANDARD',
  standard: 'STANDARD',
  deep: 'DEEP_CLEAN',
  deep_clean: 'DEEP_CLEAN',
  moveinout: 'MOVE_IN_OUT',
  move_in_out: 'MOVE_IN_OUT',
  recurring: 'RECURRING',
  turnover: 'VACATION_RENTAL_TURNOVER',
  vacation_rental_turnover: 'VACATION_RENTAL_TURNOVER',
  walkthrough: 'PROPERTY_WALKTHROUGH',
  property_walkthrough: 'PROPERTY_WALKTHROUGH',
  emergency: 'EMERGENCY_CLEAN',
  emergency_clean: 'EMERGENCY_CLEAN',
};

export function normalizeCheckoutServiceType(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (ENGINE_SERVICE_TYPES.has(trimmed)) return trimmed;
  const key = trimmed.toLowerCase().replace(/[\s-]+/g, '_');
  return CHECKOUT_SERVICE_ALIASES[key] ?? CHECKOUT_SERVICE_ALIASES[trimmed.toLowerCase()] ?? null;
}

export function buildQuoteInputFromCheckoutBody(body: Record<string, unknown>): BookingQuoteInput | null {
  const quoteInput = (body.quoteInput ?? null) as Partial<BookingQuoteInput> | null;
  const serviceType =
    normalizeCheckoutServiceType(quoteInput?.serviceType) ||
    normalizeCheckoutServiceType(body.serviceType);

  const branchSlug =
    (typeof quoteInput?.branchSlug === 'string' && quoteInput.branchSlug) ||
    (typeof body.branchSlug === 'string' && body.branchSlug) ||
    null;

  const homeSrc = quoteInput?.home ?? (body.home as BookingQuoteInput['home'] | undefined);
  const scheduleSrc =
    quoteInput?.schedule ?? (body.schedule as BookingQuoteInput['schedule'] | undefined);
  const extrasSrc =
    quoteInput?.extras ?? (body.extras as BookingQuoteInput['extras'] | undefined);
  const addOns = body.addOns as
    | { laundry?: boolean; windows?: boolean; oven?: boolean; refrigerator?: boolean }
    | undefined;

  if (!serviceType || !branchSlug) return null;

  const bedrooms = Number(homeSrc?.bedrooms ?? body.bedrooms ?? 1);
  const bathrooms = Number(homeSrc?.bathrooms ?? body.bathrooms ?? 1);
  const date =
    scheduleSrc?.date ??
    (typeof body.preferredDate === 'string' ? body.preferredDate : null);
  const timeSlot =
    scheduleSrc?.timeSlot ??
    (typeof body.preferredTime === 'string' ? body.preferredTime : null);

  if (!date || !timeSlot || !(bedrooms >= 1) || !(bathrooms >= 1)) {
    return null;
  }

  return {
    serviceType: serviceType as BookingQuoteInput['serviceType'],
    branchSlug,
    home: {
      bedrooms,
      bathrooms,
      sqft: homeSrc?.sqft != null ? Number(homeSrc.sqft) : null,
      pets: Boolean(homeSrc?.pets),
    },
    schedule: { date, timeSlot },
    extras: {
      insideFridge: Boolean(extrasSrc?.insideFridge ?? addOns?.refrigerator),
      insideOven: Boolean(extrasSrc?.insideOven ?? addOns?.oven),
      insideCabinets: Boolean(extrasSrc?.insideCabinets),
      windows: Boolean(extrasSrc?.windows ?? addOns?.windows),
      laundry: Boolean(extrasSrc?.laundry ?? addOns?.laundry),
      notes: extrasSrc?.notes ?? '',
    },
    promoCode: (quoteInput?.promoCode as string | null | undefined) ?? null,
    frequency:
      (quoteInput?.frequency as BookingQuoteInput['frequency']) ??
      (body.recurringFrequency as BookingQuoteInput['frequency']) ??
      null,
  };
}

export type AuthoritativeCheckoutQuote = {
  customerTotal: number;
  operationalTotal: number;
  processingAllowanceEstimated: number;
  pricingPolicyVersion: string | null;
  currency: string;
  warnings: string[];
};

export async function resolveAuthoritativeCheckoutQuote(
  body: Record<string, unknown>
): Promise<
  | { ok: true; quote: AuthoritativeCheckoutQuote }
  | { ok: false; error: string; status: number }
> {
  const input = buildQuoteInputFromCheckoutBody(body);
  if (!input) {
    return {
      ok: false,
      status: 400,
      error:
        'Checkout requires booking quote inputs (serviceType, branchSlug, home, schedule) so the server can price the job.',
    };
  }

  const { quote, errors } = await calculateBookingQuoteAsync(input);
  if (!quote || errors.length > 0) {
    return {
      ok: false,
      status: 400,
      error: errors[0]?.message || 'Unable to calculate authoritative price',
    };
  }

  const clientTotal =
    body.totalPrice != null && Number.isFinite(Number(body.totalPrice))
      ? Number(body.totalPrice)
      : null;

  // Reject obvious client manipulation (> $0.01 drift from server quote)
  if (clientTotal != null && Math.abs(dollarsToCents(clientTotal) - dollarsToCents(quote.total)) > 1) {
    return {
      ok: false,
      status: 400,
      error: 'Quoted total does not match server pricing. Please refresh and try again.',
    };
  }

  return {
    ok: true,
    quote: {
      customerTotal: quote.total,
      operationalTotal: quote.operationalTotal,
      processingAllowanceEstimated: quote.processingAllowanceEstimated,
      pricingPolicyVersion: quote.pricingPolicyVersion,
      currency: quote.currency || 'USD',
      warnings: quote.warnings,
    },
  };
}
