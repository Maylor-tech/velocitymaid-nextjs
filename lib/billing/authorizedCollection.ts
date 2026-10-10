import { roundMoney } from '@/lib/invoices/invoiceUtils';
import { ELIZABETH_K_PHASE2 } from './elizabethKPhase2';

export type CollectionDecision = {
  allowed: boolean;
  amount: number | null;
  code: string;
  reason: string;
};

export type InvoiceCollectionSnapshot = {
  status: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
};

function moneyEq(a: number, b: number): boolean {
  return roundMoney(a) === roundMoney(b);
}

function isElizabethJob(jobId: string | null | undefined): boolean {
  return jobId === ELIZABETH_K_PHASE2.jobId;
}

function isBlockedLeftoverAmount(amount: number): boolean {
  return ELIZABETH_K_PHASE2.blockedCollectionAmounts.some((blocked) => moneyEq(amount, blocked));
}

function authorizedPriceApplied(invoiceTotal: number | null | undefined): boolean {
  if (invoiceTotal == null) return false;
  return moneyEq(invoiceTotal, ELIZABETH_K_PHASE2.authorizedInvoiceTotal);
}

/**
 * Block only this reconciled job's stale $400 quote leftover.
 * Other PREPAY deposit/balance checkouts are unchanged.
 */
export function resolveJobBalanceCollection(input: {
  jobId: string;
  jobBalanceDue: number;
  invoice: InvoiceCollectionSnapshot | null;
}): CollectionDecision {
  const due = roundMoney(input.jobBalanceDue);
  if (due <= 0) {
    return {
      allowed: false,
      amount: null,
      code: 'NOTHING_DUE',
      reason: 'No balance due for this job.',
    };
  }

  if (isElizabethJob(input.jobId) && isBlockedLeftoverAmount(due) && !authorizedPriceApplied(input.invoice?.total)) {
    return {
      allowed: false,
      amount: null,
      code: 'UNAUTHORIZED_QUOTE_LEFTOVER',
      reason:
        'Collection of the original $400 quote leftover is blocked until the authorized $250 price adjustment is applied.',
    };
  }

  return {
    allowed: true,
    amount: due,
    code: 'JOB_BALANCE',
    reason: 'Collect the remaining prepaid job balance.',
  };
}

/**
 * Invoice checkout. DRAFT remains collectable for unrelated invoices (Incident #001).
 * This reconciled job cannot collect $400 until the authorized $250 total is applied.
 */
export function resolveInvoiceCollection(input: {
  jobId?: string | null;
  invoice: InvoiceCollectionSnapshot;
}): CollectionDecision {
  const status = input.invoice.status.toUpperCase();
  if (status === 'CANCELLED') {
    return {
      allowed: false,
      amount: null,
      code: 'INVOICE_CANCELLED',
      reason: 'Cancelled invoices cannot be collected.',
    };
  }
  if (status === 'PAID') {
    return {
      allowed: false,
      amount: null,
      code: 'INVOICE_PAID',
      reason: 'This invoice is already paid.',
    };
  }

  const due = roundMoney(input.invoice.balanceDue);
  if (due <= 0) {
    return {
      allowed: false,
      amount: null,
      code: 'NOTHING_DUE',
      reason: 'Nothing due on this invoice.',
    };
  }

  if (
    isElizabethJob(input.jobId) &&
    !authorizedPriceApplied(input.invoice.total) &&
    (isBlockedLeftoverAmount(due) || isBlockedLeftoverAmount(roundMoney(input.invoice.total)))
  ) {
    return {
      allowed: false,
      amount: null,
      code: 'UNAUTHORIZED_QUOTE_LEFTOVER',
      reason:
        'The $400 quote-leftover collection path is blocked until the authorized $250 price adjustment is applied.',
    };
  }

  return {
    allowed: true,
    amount: due,
    code: 'INVOICE_BALANCE',
    reason: 'Collect the invoice unpaid balance.',
  };
}
