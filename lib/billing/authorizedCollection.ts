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

function elizabethDepositCredited(invoice: InvoiceCollectionSnapshot | null | undefined): boolean {
  if (!invoice) return false;
  return (
    authorizedPriceApplied(invoice.total) &&
    moneyEq(invoice.amountPaid, ELIZABETH_K_PHASE2.depositAmount)
  );
}

function elizabethPhase2Hold(
  jobId: string | null | undefined,
  due: number,
  invoice: InvoiceCollectionSnapshot | null | undefined
): CollectionDecision | null {
  if (!isElizabethJob(jobId) || elizabethDepositCredited(invoice)) return null;

  const invoiceDue = invoice ? roundMoney(invoice.balanceDue) : null;
  const invoiceTotal = invoice ? roundMoney(invoice.total) : null;
  const blocksIntermediate =
    isBlockedLeftoverAmount(due) ||
    moneyEq(due, ELIZABETH_K_PHASE2.authorizedInvoiceTotal) ||
    (invoiceDue != null &&
      (isBlockedLeftoverAmount(invoiceDue) ||
        moneyEq(invoiceDue, ELIZABETH_K_PHASE2.authorizedInvoiceTotal))) ||
    (invoiceTotal != null &&
      (isBlockedLeftoverAmount(invoiceTotal) || authorizedPriceApplied(invoiceTotal)));

  if (!blocksIntermediate) return null;

  return {
    allowed: false,
    amount: null,
    code: 'ELIZABETH_K_PHASE2_HOLD',
    reason:
      'Elizabeth K collection is held until the authorized $250 invoice has the existing $25 deposit credited. $400 leftover and uncredited $250 paths stay closed.',
  };
}

/**
 * Block this reconciled job's $400 leftover and the intermediate uncredited $250.
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

  const hold = elizabethPhase2Hold(input.jobId, due, input.invoice);
  if (hold) return hold;

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

  const hold = elizabethPhase2Hold(input.jobId, due, input.invoice);
  if (hold) return hold;

  return {
    allowed: true,
    amount: due,
    code: 'INVOICE_BALANCE',
    reason: 'Collect the invoice unpaid balance.',
  };
}
