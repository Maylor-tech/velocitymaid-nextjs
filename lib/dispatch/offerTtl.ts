/**
 * Offer TTL is always env-configurable. SAME_DAY / URGENT fall back to 30
 * minutes only when DISPATCH_OFFER_TTL_MINUTES_URGENT is unset or invalid.
 * STANDARD falls back to 120 minutes when DISPATCH_OFFER_TTL_MINUTES is unset.
 */

export type DispatchUrgencyValue = 'STANDARD' | 'SAME_DAY' | 'URGENT';

const FALLBACK_STANDARD_MINUTES = 120;
const FALLBACK_URGENT_MINUTES = 30;

export function parsePositiveIntMinutes(
  raw: string | undefined,
  fallback: number
): number {
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export function getDefaultOfferTtlMinutes(
  urgency: DispatchUrgencyValue,
  env: Record<string, string | undefined> = process.env
): number {
  if (urgency === 'SAME_DAY' || urgency === 'URGENT') {
    return parsePositiveIntMinutes(
      env.DISPATCH_OFFER_TTL_MINUTES_URGENT,
      FALLBACK_URGENT_MINUTES
    );
  }
  return parsePositiveIntMinutes(
    env.DISPATCH_OFFER_TTL_MINUTES,
    FALLBACK_STANDARD_MINUTES
  );
}

/** Per-offer override from ops, else urgency/env default. */
export function resolveOfferTtlMinutes(input: {
  urgency: DispatchUrgencyValue;
  ttlMinutes?: number | null;
  env?: Record<string, string | undefined>;
}): number {
  if (
    input.ttlMinutes != null &&
    Number.isFinite(input.ttlMinutes) &&
    input.ttlMinutes > 0
  ) {
    return Math.floor(input.ttlMinutes);
  }
  return getDefaultOfferTtlMinutes(input.urgency, input.env ?? process.env);
}

export function computeExpiresAt(
  offeredAt: Date,
  ttlMinutes: number
): Date {
  return new Date(offeredAt.getTime() + ttlMinutes * 60 * 1000);
}
