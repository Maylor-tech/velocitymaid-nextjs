import { businessDateKey, parseServiceDateInput } from '@/lib/dates/serviceDate';
import { roundMoney } from '@/lib/pricing/money';

/**
 * Standing property service agreements.
 *
 * This module only reads and validates in-memory records. It does not write
 * packages, change jobs, invoices, payments, or payouts, calculate card fees,
 * or create guest stay QR codes. Properties with no package resolve to null
 * so callers keep today's behavior.
 *
 * Seasonal windows are calendar dates. A timestamp is placed on the
 * America/New_York calendar day. A date-only value stays on that day.
 *
 * PR 2B must copy included scope, exclusions, the selected rate amount, and
 * the payment preference onto the job at booking time. An in-place package
 * edit must not change a historical job.
 */

const SERVICE_TIMEZONE = 'America/New_York';

export const SERVICE_PACKAGE_CATEGORIES = ['RESIDENTIAL', 'VACATION_RENTAL'] as const;
export type ServicePackageCategory = (typeof SERVICE_PACKAGE_CATEGORIES)[number];

export const PROPERTY_PAYMENT_METHODS = ['CASH', 'CHECK', 'ZELLE', 'CARD'] as const;
export type PropertyPaymentMethod = (typeof PROPERTY_PAYMENT_METHODS)[number];

export type ServiceRateRecord = {
  id: string;
  label: string;
  customerPrice: number;
  operationalPrice: number | null;
  /** Inclusive calendar day, YYYY-MM-DD. */
  startsOn: string;
  /** Inclusive calendar day. Null means the rate stays open. */
  endsOn: string | null;
  active: boolean;
};

export type ServicePackageRecord = {
  id: string;
  propertyId: string;
  serviceCategory: ServicePackageCategory;
  serviceType: string;
  customerPrice: number;
  operationalPrice: number | null;
  includedScope: string | null;
  exclusions: string | null;
  active: boolean;
  rates: ServiceRateRecord[];
};

export type PaymentPreferenceRecord = {
  propertyId: string;
  allowedMethods: PropertyPaymentMethod[];
  preferredMethod: PropertyPaymentMethod;
};

export type ResolvedServiceTerms = {
  propertyId: string;
  packageId: string;
  rateId: string | null;
  serviceCategory: ServicePackageCategory;
  serviceType: string;
  customerPrice: number;
  operationalPrice: number | null;
  includedScope: string | null;
  exclusions: string | null;
  priceSource: 'standing' | 'seasonal';
};

export class ServicePackageValidationError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ServicePackageValidationError';
    this.code = code;
  }
}

export function isServicePackageCategory(value: unknown): value is ServicePackageCategory {
  return SERVICE_PACKAGE_CATEGORIES.some((category) => category === value);
}

export function isPropertyPaymentMethod(value: unknown): value is PropertyPaymentMethod {
  return PROPERTY_PAYMENT_METHODS.some((method) => method === value);
}

export function parseCalendarDay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const parsed = match ? parseServiceDateInput(match[0]) : null;
  if (!parsed) {
    throw new ServicePackageValidationError(
      'Seasonal dates must be calendar days.',
      'SEASONAL_RATE_DATE'
    );
  }
  return parsed.toISOString().slice(0, 10);
}

/** America/New_York calendar day for a visit. Date-only values are not shifted. */
export function serviceCalendarDay(value: string | Date): string {
  const key = businessDateKey(value, SERVICE_TIMEZONE);
  if (!key) {
    throw new ServicePackageValidationError(
      'Seasonal dates must be calendar days.',
      'SEASONAL_RATE_DATE'
    );
  }
  return key;
}

function dayNumber(value: string): number {
  return Date.parse(`${parseCalendarDay(value)}T00:00:00.000Z`);
}

function windowEnd(endsOn: string | null): number {
  return endsOn == null ? Number.POSITIVE_INFINITY : dayNumber(endsOn);
}

function assertWindow(rate: Pick<ServiceRateRecord, 'startsOn' | 'endsOn' | 'label'>): void {
  const start = dayNumber(rate.startsOn);
  const end = windowEnd(rate.endsOn);
  if (end < start) {
    throw new ServicePackageValidationError(
      `${rate.label || 'Seasonal rate'} ends before it starts.`,
      'SEASONAL_RATE_WINDOW'
    );
  }
}

/** Inclusive calendar windows. Inactive rates do not participate. */
export function seasonalRatesOverlap(
  left: Pick<ServiceRateRecord, 'startsOn' | 'endsOn' | 'active' | 'label'>,
  right: Pick<ServiceRateRecord, 'startsOn' | 'endsOn' | 'active' | 'label'>
): boolean {
  if (!left.active || !right.active) return false;
  assertWindow(left);
  assertWindow(right);
  const leftStart = dayNumber(left.startsOn);
  const rightStart = dayNumber(right.startsOn);
  return leftStart <= windowEnd(right.endsOn) && rightStart <= windowEnd(left.endsOn);
}

export function assertSeasonalRatesDoNotOverlap(rates: ServiceRateRecord[]): void {
  for (const rate of rates) {
    if (rate.active) assertWindow(rate);
  }

  const active = rates.filter((rate) => rate.active);
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      if (seasonalRatesOverlap(active[i], active[j])) {
        throw new ServicePackageValidationError(
          'Seasonal rates overlap. Choose dates that do not share a day.',
          'SEASONAL_RATE_OVERLAP'
        );
      }
    }
  }
}

function rateCovers(rate: ServiceRateRecord, day: string): boolean {
  if (!rate.active) return false;
  const target = dayNumber(day);
  return dayNumber(rate.startsOn) <= target && target <= windowEnd(rate.endsOn);
}

function money(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new ServicePackageValidationError('Package prices must be finite amounts.', 'PACKAGE_PRICE');
  }
  return roundMoney(amount);
}

/**
 * Resolve the agreement that applies to one property and service date.
 * Returns null when that property has no active package for the service,
 * including when the package list is empty or belongs to another property.
 */
export function resolvePropertyServiceTerms(input: {
  propertyId: string;
  serviceCategory: ServicePackageCategory;
  serviceType: string;
  serviceDate: string | Date;
  packages: ServicePackageRecord[];
}): ResolvedServiceTerms | null {
  const matches = input.packages.filter(
    (pkg) =>
      pkg.propertyId === input.propertyId &&
      pkg.active &&
      pkg.serviceCategory === input.serviceCategory &&
      pkg.serviceType === input.serviceType
  );

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new ServicePackageValidationError(
      'More than one active package matches this property and service.',
      'PACKAGE_AMBIGUOUS'
    );
  }

  const pkg = matches[0];
  assertSeasonalRatesDoNotOverlap(pkg.rates);
  const day = serviceCalendarDay(input.serviceDate);
  const covering = pkg.rates.filter((rate) => rateCovers(rate, day));
  if (covering.length > 1) {
    throw new ServicePackageValidationError(
      'Seasonal rates overlap. Choose dates that do not share a day.',
      'SEASONAL_RATE_OVERLAP'
    );
  }

  const rate = covering[0];
  return {
    propertyId: pkg.propertyId,
    packageId: pkg.id,
    rateId: rate?.id ?? null,
    serviceCategory: pkg.serviceCategory,
    serviceType: pkg.serviceType,
    customerPrice: money(rate ? rate.customerPrice : pkg.customerPrice),
    operationalPrice:
      (rate ? rate.operationalPrice : pkg.operationalPrice) == null
        ? null
        : money((rate ? rate.operationalPrice : pkg.operationalPrice) as number),
    includedScope: pkg.includedScope,
    exclusions: pkg.exclusions,
    priceSource: rate ? 'seasonal' : 'standing',
  };
}

export function validatePaymentPreference(input: {
  propertyId: string;
  allowedMethods: readonly string[];
  preferredMethod: string;
}): PaymentPreferenceRecord {
  if (!input.propertyId.trim()) {
    throw new ServicePackageValidationError(
      'A payment preference belongs to one property.',
      'PAYMENT_PREFERENCE_PROPERTY'
    );
  }

  const allowedMethods: PropertyPaymentMethod[] = [];
  for (const method of input.allowedMethods) {
    if (!isPropertyPaymentMethod(method)) {
      throw new ServicePackageValidationError(
        'Payment preferences accept cash, check, Zelle, or card.',
        'PAYMENT_PREFERENCE_METHOD'
      );
    }
    if (!allowedMethods.includes(method)) allowedMethods.push(method);
  }

  if (allowedMethods.length === 0) {
    throw new ServicePackageValidationError(
      'Choose at least one allowed payment method.',
      'PAYMENT_PREFERENCE_METHOD'
    );
  }

  if (!isPropertyPaymentMethod(input.preferredMethod) || !allowedMethods.includes(input.preferredMethod)) {
    throw new ServicePackageValidationError(
      'The preferred payment method must be one of the allowed methods.',
      'PAYMENT_PREFERENCE_PREFERRED'
    );
  }

  return {
    propertyId: input.propertyId,
    allowedMethods,
    preferredMethod: input.preferredMethod,
  };
}

/** One preference per property. None means existing billing behavior stays. */
export function paymentPreferenceForProperty(
  propertyId: string,
  preferences: PaymentPreferenceRecord[]
): PaymentPreferenceRecord | null {
  const matches = preferences.filter((preference) => preference.propertyId === propertyId);
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new ServicePackageValidationError(
      'A property can have only one payment preference.',
      'PAYMENT_PREFERENCE_AMBIGUOUS'
    );
  }
  return validatePaymentPreference(matches[0]);
}
