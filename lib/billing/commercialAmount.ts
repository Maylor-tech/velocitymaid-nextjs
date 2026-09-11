/**
 * Customer commercial amount: distinguish real $0 from null/unknown pricing.
 * Never coerce missing pricing to 0 for invoices or money displays.
 */

import { resolveBillingPolicy, type BillingPolicy } from '@/lib/billing/billingPolicy';

export class CommercialAmountRequiredError extends Error {
  readonly code = 'COMMERCIAL_AMOUNT_REQUIRED';

  constructor(message = 'Customer pricing is not set. Set quoted or total price before generating an invoice.') {
    super(message);
    this.name = 'CommercialAmountRequiredError';
  }
}

/** Parse a money column; null/undefined/invalid → null. Real 0 stays 0. */
export function moneyOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Prefer locked totalPrice, else quotedTotal.
 * Returns null when neither is a finite number (including when both are null).
 */
export function resolveCommercialAmount(input: {
  totalPrice?: unknown;
  quotedTotal?: unknown;
}): number | null {
  const total = moneyOrNull(input.totalPrice);
  if (total != null) return total;
  return moneyOrNull(input.quotedTotal);
}

export function requireCommercialAmount(input: {
  totalPrice?: unknown;
  quotedTotal?: unknown;
}): number {
  const amount = resolveCommercialAmount(input);
  if (amount == null) {
    throw new CommercialAmountRequiredError();
  }
  return amount;
}

export function formatCommercialMoney(
  amount: number | null | undefined,
  currency: string | null | undefined = 'USD',
  missingLabel = 'Not set'
): string {
  if (amount == null) return missingLabel;
  const curr = currency || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type DepositDisplayKind = 'not_required' | 'amount' | 'missing';

export type DepositPaidDisplay = {
  kind: DepositDisplayKind;
  amount: number | null;
  label: string;
};

/**
 * Payment Summary deposit line: never contradict Operational Progress.
 * Invoice-after-service with no deposit taken → explicit "Not required".
 */
export function resolveDepositPaidDisplay(input: {
  billingPolicy?: string | null;
  paymentStatus: string;
  depositAmount?: unknown;
  amountPaid?: unknown;
}): DepositPaidDisplay {
  const policy: BillingPolicy = resolveBillingPolicy({
    jobPolicy: input.billingPolicy,
  });
  const payment = input.paymentStatus.toUpperCase();
  const deposit = moneyOrNull(input.depositAmount);
  const paid = moneyOrNull(input.amountPaid);
  const amount = deposit ?? paid;

  const depositCollected =
    payment === 'DEPOSIT_PAID' ||
    payment === 'BALANCE_DUE' ||
    payment === 'PAID';

  if (
    policy === 'INVOICE_AFTER_SERVICE' &&
    !depositCollected &&
    (amount == null || amount === 0)
  ) {
    return { kind: 'not_required', amount: null, label: 'Not required' };
  }

  if (amount == null) {
    return { kind: 'missing', amount: null, label: 'N/A' };
  }

  return { kind: 'amount', amount, label: formatCommercialMoney(amount) };
}

/** Operational Progress first milestone — label + whether it is satisfied. */
export function resolveDepositMilestone(input: {
  billingPolicy?: string | null;
  paymentStatus: string;
}): { id: 'deposit'; label: string; satisfied: boolean } {
  const policy = resolveBillingPolicy({ jobPolicy: input.billingPolicy });
  const payment = input.paymentStatus.toUpperCase();
  const depositCollected =
    payment === 'DEPOSIT_PAID' ||
    payment === 'BALANCE_DUE' ||
    payment === 'PAID';

  if (policy === 'INVOICE_AFTER_SERVICE' && !depositCollected) {
    return {
      id: 'deposit',
      label: 'Deposit not required',
      satisfied: true,
    };
  }

  return {
    id: 'deposit',
    label: 'Deposit paid',
    satisfied: depositCollected,
  };
}
