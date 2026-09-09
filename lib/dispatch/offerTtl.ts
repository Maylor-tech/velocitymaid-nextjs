/**
 * Offer TTL: SAME_DAY / URGENT stay short. STANDARD is service-date-aware
 * so a future clean does not expire in two hours unless ops overrides.
 *
 * Env:
 *   DISPATCH_OFFER_TTL_MINUTES — STANDARD near-window / missing-date fallback (default 120)
 *   DISPATCH_OFFER_TTL_MINUTES_URGENT — SAME_DAY / URGENT (default 30)
 */

import { hoursUntilService, resolveServiceStart } from '@/lib/dates/preferredClock';

export type DispatchUrgencyValue = 'STANDARD' | 'SAME_DAY' | 'URGENT';

export type OfferTtlSource = 'OVERRIDE' | 'SERVICE_AWARE' | 'URGENCY_DEFAULT';

export type OfferTtlResolution = {
  ttlMinutes: number;
  defaultMinutes: number;
  overrideUsed: boolean;
  clampedToSafetyCutoff: boolean;
  expiresAt: Date;
  source: OfferTtlSource;
  hoursUntilService: number | null;
  defaultLabel: string;
};

const FALLBACK_STANDARD_MINUTES = 120;
const FALLBACK_URGENT_MINUTES = 30;
const STANDARD_FAR_MINUTES = 24 * 60;
const STANDARD_MID_MINUTES = 8 * 60;
const SAFETY_BEFORE_SERVICE_MINUTES = 60;
const MIN_OFFER_TTL_MINUTES = 15;
const MAX_OVERRIDE_MINUTES = 7 * 24 * 60;

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

export function standardTtlMinutesForHorizon(
  hoursUntil: number | null,
  env: Record<string, string | undefined> = process.env
): { minutes: number; label: string; source: OfferTtlSource } {
  const near = getDefaultOfferTtlMinutes('STANDARD', env);
  if (hoursUntil == null) {
    return {
      minutes: near,
      label: `${near} minutes — no service date on file`,
      source: 'URGENCY_DEFAULT',
    };
  }
  if (hoursUntil > 48) {
    return {
      minutes: STANDARD_FAR_MINUTES,
      label: '24 hours — service is more than 48 hours away',
      source: 'SERVICE_AWARE',
    };
  }
  if (hoursUntil >= 24) {
    return {
      minutes: STANDARD_MID_MINUTES,
      label: '8 hours — service is 24–48 hours away',
      source: 'SERVICE_AWARE',
    };
  }
  return {
    minutes: near,
    label: `${near} minutes — service is less than 24 hours away`,
    source: 'URGENCY_DEFAULT',
  };
}

function clampOverrideMinutes(raw: number): number {
  return Math.min(Math.max(Math.floor(raw), 1), MAX_OVERRIDE_MINUTES);
}

export function computeExpiresAt(
  offeredAt: Date,
  ttlMinutes: number
): Date {
  return new Date(offeredAt.getTime() + ttlMinutes * 60 * 1000);
}

function applySafetyCutoff(
  offeredAt: Date,
  requestedExpiresAt: Date,
  preferredDate?: Date | string | null,
  preferredTime?: string | null
): { expiresAt: Date; clamped: boolean } {
  const serviceStart = resolveServiceStart(preferredDate, preferredTime);
  if (!serviceStart) {
    return { expiresAt: requestedExpiresAt, clamped: false };
  }

  const cutoff = new Date(
    serviceStart.getTime() - SAFETY_BEFORE_SERVICE_MINUTES * 60 * 1000
  );
  let maxExpires = cutoff;
  if (maxExpires.getTime() <= offeredAt.getTime()) {
    maxExpires =
      serviceStart.getTime() > offeredAt.getTime()
        ? serviceStart
        : new Date(offeredAt.getTime() + MIN_OFFER_TTL_MINUTES * 60 * 1000);
  }

  if (requestedExpiresAt.getTime() > maxExpires.getTime()) {
    return { expiresAt: maxExpires, clamped: true };
  }
  if (requestedExpiresAt.getTime() <= offeredAt.getTime()) {
    return {
      expiresAt: new Date(offeredAt.getTime() + MIN_OFFER_TTL_MINUTES * 60 * 1000),
      clamped: true,
    };
  }
  return { expiresAt: requestedExpiresAt, clamped: false };
}

export function resolveOfferExpiration(input: {
  urgency: DispatchUrgencyValue;
  ttlMinutes?: number | null;
  preferredDate?: Date | string | null;
  preferredTime?: string | null;
  offeredAt?: Date;
  now?: Date;
  env?: Record<string, string | undefined>;
}): OfferTtlResolution {
  const env = input.env ?? process.env;
  const offeredAt = input.offeredAt ?? input.now ?? new Date();
  const hours = hoursUntilService(
    input.preferredDate,
    input.preferredTime,
    offeredAt
  );

  let defaultMinutes: number;
  let defaultLabel: string;
  let source: OfferTtlSource;

  if (input.urgency === 'SAME_DAY' || input.urgency === 'URGENT') {
    defaultMinutes = getDefaultOfferTtlMinutes(input.urgency, env);
    defaultLabel = `${defaultMinutes} minutes — ${input.urgency === 'URGENT' ? 'urgent' : 'same-day'} short window`;
    source = 'URGENCY_DEFAULT';
  } else {
    const horizon = standardTtlMinutesForHorizon(hours, env);
    defaultMinutes = horizon.minutes;
    defaultLabel = horizon.label;
    source = horizon.source;
  }

  const overrideUsed =
    input.ttlMinutes != null &&
    Number.isFinite(input.ttlMinutes) &&
    input.ttlMinutes > 0;
  const requestedMinutes = overrideUsed
    ? clampOverrideMinutes(Number(input.ttlMinutes))
    : defaultMinutes;

  const rawExpires = computeExpiresAt(offeredAt, requestedMinutes);
  const { expiresAt, clamped } = applySafetyCutoff(
    offeredAt,
    rawExpires,
    input.preferredDate,
    input.preferredTime
  );
  const ttlMinutes = Math.max(
    1,
    Math.round((expiresAt.getTime() - offeredAt.getTime()) / 60000)
  );

  return {
    ttlMinutes,
    defaultMinutes,
    overrideUsed,
    clampedToSafetyCutoff: clamped,
    expiresAt,
    source: overrideUsed ? 'OVERRIDE' : source,
    hoursUntilService: hours,
    defaultLabel,
  };
}

/** Per-offer override from ops, else urgency / service-aware default (after clamp). */
export function resolveOfferTtlMinutes(input: {
  urgency: DispatchUrgencyValue;
  ttlMinutes?: number | null;
  preferredDate?: Date | string | null;
  preferredTime?: string | null;
  offeredAt?: Date;
  env?: Record<string, string | undefined>;
}): number {
  return resolveOfferExpiration(input).ttlMinutes;
}

export function inferOverrideUsed(
  offeredAt: Date | string,
  expiresAt: Date | string,
  defaultMinutes: number
): boolean {
  const start = offeredAt instanceof Date ? offeredAt : new Date(offeredAt);
  const end = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const applied = Math.round((end.getTime() - start.getTime()) / 60000);
  return Math.abs(applied - defaultMinutes) > 1;
}
