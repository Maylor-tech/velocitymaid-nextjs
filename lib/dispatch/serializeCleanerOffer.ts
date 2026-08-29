import { formatServiceDate } from '@/lib/dates/serviceDate';
import {
  toCleanerOfferLocationView,
  type CleanerOfferLocationView,
} from './cleanerViews';

const FORBIDDEN_CUSTOMER_PRICE_KEYS = [
  'quotedTotal',
  'totalPrice',
  'amountPaid',
  'balanceDue',
  'depositAmount',
  'invoiceTotal',
  'invoice',
] as const;

export type CleanerOfferJson = {
  offerId: string;
  jobId: string;
  status: string;
  jobReference: string | null;
  serviceType: string | null;
  serviceDate: string;
  preferredTime: string | null;
  location: CleanerOfferLocationView;
  estimatedDurationMins: number | null;
  compensationAmount: number;
  compensationCurrency: string;
  operationalNotes: string | null;
  expiresAt: string;
  offeredAt: string;
};

export type CleanerOfferSource = {
  id: string;
  jobId: string;
  status: string;
  compensationAmount: unknown;
  compensationCurrency: string;
  estimatedDurationMins: number | null;
  operationalNotes: string | null;
  expiresAt: Date;
  offeredAt: Date;
  Job: {
    jobReference: string | null;
    serviceType: string | null;
    preferredDate: Date | null;
    preferredTime: string | null;
    serviceLocation: string | null;
    address?: string | null;
    quotedTotal?: unknown;
    totalPrice?: unknown;
    amountPaid?: unknown;
    balanceDue?: unknown;
    Property?: { city: string | null; state: string | null } | null;
  };
};

export function serializeCleanerOffer(row: CleanerOfferSource): CleanerOfferJson {
  const payload: CleanerOfferJson = {
    offerId: row.id,
    jobId: row.jobId,
    status: row.status,
    jobReference: row.Job.jobReference,
    serviceType: row.Job.serviceType,
    serviceDate: formatServiceDate(row.Job.preferredDate, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    preferredTime: row.Job.preferredTime,
    location: toCleanerOfferLocationView({
      serviceLocation: row.Job.serviceLocation,
      property: row.Job.Property ?? null,
    }),
    estimatedDurationMins: row.estimatedDurationMins,
    compensationAmount: Number(row.compensationAmount),
    compensationCurrency: row.compensationCurrency,
    operationalNotes: row.operationalNotes,
    expiresAt: row.expiresAt.toISOString(),
    offeredAt: row.offeredAt.toISOString(),
  };

  assertNoForbiddenPriceFields(payload);
  return payload;
}

export function assertNoForbiddenPriceFields(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return;
  const keys = collectKeys(payload);
  for (const forbidden of FORBIDDEN_CUSTOMER_PRICE_KEYS) {
    if (keys.has(forbidden.toLowerCase())) {
      throw new Error(`Cleaner offer payload leaked ${forbidden}`);
    }
  }
}

function collectKeys(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (!value || typeof value !== 'object') return into;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, into);
    return into;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    into.add(key.toLowerCase());
    collectKeys(child, into);
  }
  return into;
}
