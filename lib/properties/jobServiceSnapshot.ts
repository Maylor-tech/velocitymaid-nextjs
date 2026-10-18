import { roundMoney } from '@/lib/pricing/money';
import {
  ServicePackageValidationError,
  isServicePackageCategory,
  paymentPreferenceForProperty,
  resolvePropertyServiceTerms,
  type PaymentPreferenceRecord,
  type ServicePackageRecord,
} from '@/lib/properties/servicePackage';

/**
 * Copies the resolved service agreement onto a new job.
 * The returned values are plain copies. Editing the package or rate afterward
 * does not change them, and this function does not write the package.
 *
 * Price precedence is the 2A rule: an active seasonal rate covering the
 * service date wins; otherwise the package customerPrice is used.
 * A one-off visit price replaces only the amount charged on this job.
 */

export type JobServiceSnapshot = {
  servicePackageId: string;
  serviceRateId: string | null;
  agreedCustomerPrice: number;
  agreedOperationalPrice: number | null;
  includedScopeSnapshot: string | null;
  exclusionsSnapshot: string | null;
  paymentPreferenceSnapshot: {
    allowedMethods: PaymentPreferenceRecord['allowedMethods'];
    preferredMethod: PaymentPreferenceRecord['preferredMethod'];
  } | null;
  priceOverridden: boolean;
  priceOverrideReason: string | null;
  /** Amount to store on Job.totalPrice / quotedTotal. */
  customerTotal: number;
  /** Amount to store on Job.operationalTotal. Not replaced by a one-off price. */
  operationalTotal: number;
};

export type StoredServiceRateRow = {
  id: string;
  label: string;
  customerPrice: unknown;
  operationalPrice: unknown;
  startsOn: Date | string;
  endsOn: Date | string | null;
  active: boolean;
};

export type StoredServicePackageRow = {
  id: string;
  propertyId: string;
  serviceCategory: string;
  serviceType: string;
  customerPrice: unknown;
  operationalPrice: unknown;
  includedScope: string | null;
  exclusions: string | null;
  active: boolean;
  Rates: StoredServiceRateRow[];
};

function moneyValue(value: unknown, label: string): number {
  if (value == null || value === '') {
    throw new ServicePackageValidationError(`${label} is required.`, 'PACKAGE_PRICE');
  }
  let amount: number;
  if (typeof value === 'number') {
    amount = value;
  } else if (
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  ) {
    amount = value.toNumber();
  } else {
    amount = Number(value);
  }
  if (!Number.isFinite(amount)) {
    throw new ServicePackageValidationError(`${label} must be a finite amount.`, 'PACKAGE_PRICE');
  }
  return amount;
}

function moneyOrNull(value: unknown, label: string): number | null {
  if (value == null || value === '') return null;
  return moneyValue(value, label);
}

/** DATE columns are calendar days. Read them in UTC so a date does not shift. */
export function calendarDayFromStoredDate(value: Date | string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ServicePackageValidationError('Seasonal dates must be calendar days.', 'SEASONAL_RATE_DATE');
    }
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${value.getUTCFullYear()}-${month}-${day}`;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (!match) {
    throw new ServicePackageValidationError('Seasonal dates must be calendar days.', 'SEASONAL_RATE_DATE');
  }
  return match[1];
}

export function servicePackagesFromRows(rows: StoredServicePackageRow[]): ServicePackageRecord[] {
  return rows.map((row) => {
    if (!isServicePackageCategory(row.serviceCategory)) {
      throw new ServicePackageValidationError(
        'Service package category must be residential or vacation rental.',
        'PACKAGE_CATEGORY'
      );
    }
    return {
      id: row.id,
      propertyId: row.propertyId,
      serviceCategory: row.serviceCategory,
      serviceType: row.serviceType,
      customerPrice: moneyValue(row.customerPrice, 'Package customer price'),
      operationalPrice: moneyOrNull(row.operationalPrice, 'Package operational price'),
      includedScope: row.includedScope,
      exclusions: row.exclusions,
      active: row.active,
      rates: row.Rates.map((rate) => ({
        id: rate.id,
        label: rate.label,
        customerPrice: moneyValue(rate.customerPrice, 'Seasonal customer price'),
        operationalPrice: moneyOrNull(rate.operationalPrice, 'Seasonal operational price'),
        startsOn: calendarDayFromStoredDate(rate.startsOn),
        endsOn: rate.endsOn == null ? null : calendarDayFromStoredDate(rate.endsOn),
        active: rate.active,
      })),
    };
  });
}

export function buildJobServiceSnapshot(input: {
  propertyId: string;
  serviceCategory: ServicePackageRecord['serviceCategory'];
  serviceType: string;
  serviceDate: string | Date;
  packages: ServicePackageRecord[];
  preferences: PaymentPreferenceRecord[];
  visitPriceOverride: number | null;
  priceOverrideReason: string | null;
}): JobServiceSnapshot | null {
  const terms = resolvePropertyServiceTerms({
    propertyId: input.propertyId,
    serviceCategory: input.serviceCategory,
    serviceType: input.serviceType,
    serviceDate: input.serviceDate,
    packages: input.packages,
  });

  if (!terms) {
    if (input.visitPriceOverride != null) {
      throw new ServicePackageValidationError(
        'A one-off price requires a service package for this visit.',
        'PRICE_OVERRIDE_PACKAGE'
      );
    }
    return null;
  }

  const reason = input.priceOverrideReason?.trim() || '';
  const hasOverride = input.visitPriceOverride != null;
  if (hasOverride && !reason) {
    throw new ServicePackageValidationError(
      'A one-off price needs a reason. The standing package is not changed.',
      'PRICE_OVERRIDE_REASON'
    );
  }
  if (hasOverride && (!Number.isFinite(input.visitPriceOverride) || (input.visitPriceOverride as number) < 0)) {
    throw new ServicePackageValidationError(
      'A one-off price must be zero or greater.',
      'PRICE_OVERRIDE_AMOUNT'
    );
  }

  const preference = paymentPreferenceForProperty(input.propertyId, input.preferences);
  const agreedCustomerPrice = terms.customerPrice;
  const agreedOperationalPrice = terms.operationalPrice;
  const customerTotal = hasOverride ? roundMoney(input.visitPriceOverride as number) : agreedCustomerPrice;
  const operationalTotal = agreedOperationalPrice ?? agreedCustomerPrice;

  return {
    servicePackageId: terms.packageId,
    serviceRateId: terms.rateId,
    agreedCustomerPrice,
    agreedOperationalPrice,
    includedScopeSnapshot: terms.includedScope,
    exclusionsSnapshot: terms.exclusions,
    paymentPreferenceSnapshot: preference
      ? {
          allowedMethods: [...preference.allowedMethods],
          preferredMethod: preference.preferredMethod,
        }
      : null,
    priceOverridden: hasOverride,
    priceOverrideReason: hasOverride ? reason : null,
    customerTotal,
    operationalTotal,
  };
}
