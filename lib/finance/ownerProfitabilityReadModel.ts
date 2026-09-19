/**
 * Owner Profitability read model — P0 authoritative finance KPIs.
 *
 * READ-ONLY over Invoice, InvoicePayment, and JobPayout.
 * No Math.random, no legacy demo costs, no write paths.
 *
 * Invoiced ≠ Collected. Payable ≠ Paid. Platform Gross Share ≠ Profit.
 */
import type { PrismaClient, Prisma } from '@prisma/client';
import { InvoiceStatus } from '@prisma/client';

/** Issued (non-draft) invoices count toward Invoiced Revenue. */
export const ISSUED_INVOICE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
];

/** Open A/R — issued invoices that still show a balance. */
export const OPEN_AR_INVOICE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.OVERDUE,
];

export const NOT_RECORDED = 'Not recorded' as const;
export const UNAVAILABLE = 'Unavailable' as const;

export type OwnerProfitabilityScope =
  | { mode: 'branch'; branchId: string; branchName: string | null }
  | { mode: 'global'; branchId: null; branchName: null };

export type OwnerProfitabilityPrimary = {
  invoicedRevenue: number;
  /** DRAFT invoice totals — labeled separately; not included in invoicedRevenue. */
  draftInvoicedTotal: number;
  collectedRevenue: number;
  outstandingAr: number;
  cleanerPayable: number;
  cleanerPaid: number;
  platformGrossShare: number;
};

export type OwnerProfitabilitySecondary = {
  processingCost: null;
  processingCostLabel: typeof NOT_RECORDED;
  directJobCosts: null;
  directJobCostsLabel: typeof NOT_RECORDED;
  contributionProfit: null;
  contributionProfitLabel: typeof UNAVAILABLE;
  contributionMargin: null;
  contributionMarginLabel: typeof UNAVAILABLE;
  costsComplete: false;
};

export type OwnerProfitabilitySnapshot = {
  scope: OwnerProfitabilityScope;
  primary: OwnerProfitabilityPrimary;
  secondary: OwnerProfitabilitySecondary;
  disclaimer: string;
  counts: {
    issuedInvoiceCount: number;
    draftInvoiceCount: number;
    paymentCount: number;
    payablePayoutCount: number;
    paidPayoutCount: number;
  };
};

export type OwnerProfitabilityInvoiceRow = {
  id: string;
  total: number;
  balanceDue: number;
  status: string;
};

export type OwnerProfitabilityPaymentRow = {
  amount: number;
  invoiceId: string;
};

export type OwnerProfitabilityPayoutRow = {
  cleanerAmount: number;
  platformFee: number;
  status: string;
  paidAt: Date | null;
};

function money(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}

function sum(nums: number[]): number {
  return Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100;
}

export function isCleanerPayoutPaid(payout: {
  status: string;
  paidAt?: Date | null;
}): boolean {
  const status = String(payout.status || '').toUpperCase();
  if (status === 'PAID') return true;
  if (payout.paidAt != null) return true;
  return false;
}

export function isCleanerPayoutPayable(payout: {
  status: string;
  paidAt?: Date | null;
}): boolean {
  const status = String(payout.status || '').toUpperCase();
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'VOID') {
    return false;
  }
  return !isCleanerPayoutPaid(payout);
}

export function isIssuedInvoiceStatus(status: string): boolean {
  return ISSUED_INVOICE_STATUSES.includes(status as InvoiceStatus);
}

export function isOpenArInvoiceStatus(status: string): boolean {
  return OPEN_AR_INVOICE_STATUSES.includes(status as InvoiceStatus);
}

/**
 * Pure aggregation — deterministic given the same rows.
 * Safe for unit tests without a database.
 */
export function computeOwnerProfitability(input: {
  scope: OwnerProfitabilityScope;
  invoices: OwnerProfitabilityInvoiceRow[];
  payments: OwnerProfitabilityPaymentRow[];
  payouts: OwnerProfitabilityPayoutRow[];
}): OwnerProfitabilitySnapshot {
  const issued = input.invoices.filter((inv) => isIssuedInvoiceStatus(inv.status));
  const drafts = input.invoices.filter(
    (inv) => String(inv.status).toUpperCase() === InvoiceStatus.DRAFT
  );
  const openAr = input.invoices.filter(
    (inv) => isOpenArInvoiceStatus(inv.status) && money(inv.balanceDue) > 0
  );

  const payablePayouts = input.payouts.filter(isCleanerPayoutPayable);
  const paidPayouts = input.payouts.filter(isCleanerPayoutPaid);

  return {
    scope: input.scope,
    primary: {
      invoicedRevenue: sum(issued.map((i) => money(i.total))),
      draftInvoicedTotal: sum(drafts.map((i) => money(i.total))),
      collectedRevenue: sum(input.payments.map((p) => money(p.amount))),
      outstandingAr: sum(openAr.map((i) => money(i.balanceDue))),
      cleanerPayable: sum(payablePayouts.map((p) => money(p.cleanerAmount))),
      cleanerPaid: sum(paidPayouts.map((p) => money(p.cleanerAmount))),
      platformGrossShare: sum(input.payouts.map((p) => money(p.platformFee))),
    },
    secondary: {
      processingCost: null,
      processingCostLabel: NOT_RECORDED,
      directJobCosts: null,
      directJobCostsLabel: NOT_RECORDED,
      contributionProfit: null,
      contributionProfitLabel: UNAVAILABLE,
      contributionMargin: null,
      contributionMarginLabel: UNAVAILABLE,
      costsComplete: false,
    },
    disclaimer:
      'Invoiced is not the same as collected. Cleaner payable is not the same as cleaner paid. Platform gross share is not profit.',
    counts: {
      issuedInvoiceCount: issued.length,
      draftInvoiceCount: drafts.length,
      paymentCount: input.payments.length,
      payablePayoutCount: payablePayouts.length,
      paidPayoutCount: paidPayouts.length,
    },
  };
}

type DbClient = PrismaClient | Prisma.TransactionClient;

function invoiceBranchWhere(branchId: string | null): Prisma.InvoiceWhereInput {
  if (!branchId) return { status: { not: InvoiceStatus.CANCELLED } };
  return {
    status: { not: InvoiceStatus.CANCELLED },
    OR: [
      { Job: { branchId } },
      { AND: [{ jobId: null }, { Customer: { branchId } }] },
    ],
  };
}

function payoutBranchWhere(branchId: string | null): Prisma.JobPayoutWhereInput {
  if (!branchId) return {};
  return { branchId };
}

/**
 * Load authoritative rows and compute the owner snapshot.
 * Performs findMany only — never creates or updates finance records.
 */
export async function loadOwnerProfitability(
  db: DbClient,
  input: {
    branchId: string | null;
    branchName?: string | null;
  }
): Promise<OwnerProfitabilitySnapshot> {
  const branchId = input.branchId?.trim() || null;
  const invoiceWhere = invoiceBranchWhere(branchId);
  const payoutWhere = payoutBranchWhere(branchId);

  const [invoices, payouts] = await Promise.all([
    db.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        total: true,
        balanceDue: true,
        status: true,
      },
    }),
    db.jobPayout.findMany({
      where: payoutWhere,
      select: {
        cleanerAmount: true,
        platformFee: true,
        status: true,
        paidAt: true,
      },
    }),
  ]);

  const invoiceIds = invoices.map((i) => i.id);
  const payments =
    invoiceIds.length === 0
      ? []
      : await db.invoicePayment.findMany({
          where: { invoiceId: { in: invoiceIds } },
          select: { amount: true, invoiceId: true },
        });

  const scope: OwnerProfitabilityScope = branchId
    ? {
        mode: 'branch',
        branchId,
        branchName: input.branchName ?? null,
      }
    : { mode: 'global', branchId: null, branchName: null };

  return computeOwnerProfitability({
    scope,
    invoices: invoices.map((i) => ({
      id: i.id,
      total: money(i.total),
      balanceDue: money(i.balanceDue),
      status: i.status,
    })),
    payments: payments.map((p) => ({
      amount: money(p.amount),
      invoiceId: p.invoiceId,
    })),
    payouts: payouts.map((p) => ({
      cleanerAmount: money(p.cleanerAmount),
      platformFee: money(p.platformFee),
      status: p.status,
      paidAt: p.paidAt,
    })),
  });
}
