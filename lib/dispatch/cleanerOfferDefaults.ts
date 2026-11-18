import { CLEANER_SHARE, round2 } from '@/lib/payoutRules';
import { CompensationRequiredError } from '@/lib/dispatch/compensation';

function toPositiveMoney(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return round2(n);
}

/**
 * Default cleaner pay for a new offer.
 * Uses the agreed customer price, then totalPrice. Rounded to the cent.
 */
export function defaultCleanerOfferPay(input: {
  agreedCustomerPrice?: unknown;
  totalPrice?: unknown;
}): number | null {
  const base =
    toPositiveMoney(input.agreedCustomerPrice) ?? toPositiveMoney(input.totalPrice);
  if (base == null) return null;
  return round2(base * CLEANER_SHARE);
}

export function sameCent(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

/** Null when pay matches the default. A different amount requires a reason. */
export function resolvePayOverrideReason(input: {
  amount: number;
  defaultPay: number | null;
  reason?: string | null;
}): string | null {
  const matchesDefault =
    input.defaultPay != null && sameCent(input.amount, input.defaultPay);
  if (matchesDefault) return null;
  const reason = input.reason?.trim() ?? '';
  if (!reason) {
    throw new CompensationRequiredError(
      'Add a short reason when cleaner pay is not the 65% default.'
    );
  }
  return reason;
}

const DURATION_HOURS = {
  2: 3,
  3: 5,
  4: 6,
  large4: 7,
} as const;

export function isLargeFourBedroom(label: string | null | undefined): boolean {
  return /large\s*4/i.test(label ?? '');
}

/**
 * Total cleaner-hours for a turnover, split across the crew when more than one
 * cleaner is on the job. Returns minutes. Unknown bedroom counts stay unset.
 */
export function defaultCleanerDurationMins(input: {
  bedrooms: number | null | undefined;
  largeFourBedroom?: boolean;
  cleanerCount?: number | null;
}): number | null {
  let hours: number | null = null;
  if (input.bedrooms === 4 && input.largeFourBedroom) hours = DURATION_HOURS.large4;
  else if (input.bedrooms === 2) hours = DURATION_HOURS[2];
  else if (input.bedrooms === 3) hours = DURATION_HOURS[3];
  else if (input.bedrooms === 4) hours = DURATION_HOURS[4];
  if (hours == null) return null;
  const count = Math.max(1, Math.floor(input.cleanerCount ?? 1));
  return Math.round((hours * 60) / count);
}
