import { formatServiceDate } from '@/lib/dates/serviceDate';
import { assertNoCustomerFinancials } from './cleanerFinancialGuard';
import {
  toCleanerCompensationView,
  type CleanerCompensationView,
} from './compensation';
import {
  toCleanerOfferLocationView,
  type CleanerOfferLocationView,
} from './cleanerViews';
import { effectiveOfferStatus } from './offerExpiry';

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
  /** Canonical cleaner pay. Independent of customer pricing. */
  compensation: CleanerCompensationView;
  compensationAmount: number;
  compensationCurrency: string;
  compensationBasis: CleanerCompensationView['basis'];
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
  compensationBasis?: unknown;
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
    operationalTotal?: unknown;
    Property?: { city: string | null; state: string | null } | null;
  };
};

export function serializeCleanerOffer(row: CleanerOfferSource): CleanerOfferJson {
  const compensation = toCleanerCompensationView({
    amount: row.compensationAmount,
    currency: row.compensationCurrency,
    basis: row.compensationBasis,
  });

  const payload: CleanerOfferJson = {
    offerId: row.id,
    jobId: row.jobId,
    status: effectiveOfferStatus(row),
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
    compensation,
    compensationAmount: compensation.amount,
    compensationCurrency: compensation.currency,
    compensationBasis: compensation.basis,
    operationalNotes: row.operationalNotes,
    expiresAt: row.expiresAt.toISOString(),
    offeredAt: row.offeredAt.toISOString(),
  };

  assertNoCustomerFinancials(payload, 'cleaner offer');
  return payload;
}
