/**
 * Incident #001 — P5 send gate (+ honest minimal P4).
 *
 * One centralized validator that every "send invoice" path must pass through.
 * It separates:
 *   - ERRORS   → broken accounting / identity. Never overridable.
 *   - WARNINGS → legitimate-but-suspicious. Require explicit acknowledgement.
 *
 * The core evaluation (`evaluateInvoiceSendable`) is pure and side-effect free
 * for unit testing; `validateInvoiceSendable` loads the data and delegates.
 *
 * Phase 1 scope note (P4): the system cannot mathematically discover a
 * reimbursement it was never told about (job total $300 == invoice $300 with a
 * missing reimbursement is invisible to any total-comparison check — this is
 * exactly how invoice 0022 left at $300). So Phase 1 requires an explicit human
 * completeness assertion (`reimbursementsConfirmed`, code C8b) at send time.
 */

import type { InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { decimalToNumber, roundMoney } from '@/lib/invoices/invoiceUtils';
import { isSameServiceDay } from '@/lib/dates/serviceDate';

export interface InvoiceSendFinding {
  code: string;
  message: string;
}

/**
 * Flat result shape (both `errors` and `warnings` always present) so callers can
 * read them without discriminated-union narrowing — this repo compiles with
 * `strict: false`, under which negated-discriminant narrowing is unreliable.
 *
 * - `ok: true`  → `errors` is empty; `warnings` are the raised-and-acknowledged
 *   findings (kept for auditing).
 * - `ok: false` → `errors` (if any) block hard; otherwise `warnings` are
 *   unacknowledged findings that block until acknowledged.
 */
export interface InvoiceSendValidationResult {
  ok: boolean;
  errors: InvoiceSendFinding[];
  warnings: InvoiceSendFinding[];
}

/** Error codes — none of these are ever overridable. */
export const INVOICE_SEND_ERRORS = {
  NOT_FOUND: 'INVOICE_NOT_FOUND',
  NOT_DRAFT: 'INVOICE_NOT_DRAFT',
  NO_LINE_ITEMS: 'INVOICE_NO_LINE_ITEMS',
  TOTAL_MISMATCH: 'INVOICE_TOTAL_MISMATCH',
  NO_CLIENT_EMAIL: 'INVOICE_NO_CLIENT_EMAIL',
  JOB_PROPERTY_MISMATCH: 'INVOICE_JOB_PROPERTY_MISMATCH',
  CUSTOMER_MISMATCH: 'INVOICE_CUSTOMER_MISMATCH',
  JOB_DATE_MISMATCH: 'INVOICE_JOB_DATE_MISMATCH',
  DUPLICATE_SERVICE: 'INVOICE_DUPLICATE_SERVICE',
  REIMBURSEMENTS_UNCONFIRMED: 'INVOICE_REIMBURSEMENTS_UNCONFIRMED',
  NUMBER_CONFLICT: 'INVOICE_NUMBER_CONFLICT',
} as const;

/** Warning codes — the ONLY findings an admin may acknowledge to proceed. */
export const INVOICE_SEND_WARNINGS = {
  JOB_TOTAL_MISMATCH: 'INVOICE_JOB_TOTAL_MISMATCH',
  RECENT_SEND_CONFLICT: 'INVOICE_RECENT_SEND_CONFLICT',
} as const;

/** Acknowledgement is scoped to warnings only; errors can never be bypassed. */
export const OVERRIDABLE_WARNING_CODES: readonly string[] = [
  INVOICE_SEND_WARNINGS.JOB_TOTAL_MISMATCH,
  INVOICE_SEND_WARNINGS.RECENT_SEND_CONFLICT,
];

const RECENT_SEND_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface EvaluableInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  clientEmail: string | null;
  clientName: string;
  customerId: string | null;
  propertyAddress: string;
  jobDate: Date | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: Array<{ lineTotal: number }>;
}

export interface EvaluableJob {
  id: string;
  address: string | null;
  preferredDate: Date | null;
  totalPrice: number | null;
  quotedTotal: number | null;
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
}

/** A non-draft invoice that shares this customer + property (potential dupe). */
export interface SiblingInvoice {
  id: string;
  status: InvoiceStatus;
  jobDate: Date | null;
  sentAt: Date | null;
}

export interface EvaluateInvoiceSendableInput {
  invoice: EvaluableInvoice | null;
  job: EvaluableJob | null;
  siblings: SiblingInvoice[];
  /** Another invoice already owns this invoice number (should be impossible given @unique). */
  invoiceNumberConflict: boolean;
  options?: {
    reimbursementsConfirmed?: boolean;
    acknowledgeWarnings?: string[];
  };
  now?: Date;
}

function normalize(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

/**
 * Pure send-gate evaluation. No I/O. All DB reads happen in
 * {@link validateInvoiceSendable}; this function only decides.
 */
export function evaluateInvoiceSendable(
  input: EvaluateInvoiceSendableInput
): InvoiceSendValidationResult {
  const errors: InvoiceSendFinding[] = [];
  const rawWarnings: InvoiceSendFinding[] = [];
  const { invoice, job, siblings, options } = input;
  const now = input.now ?? new Date();

  // C1 — invoice exists.
  if (!invoice) {
    return {
      ok: false,
      errors: [{ code: INVOICE_SEND_ERRORS.NOT_FOUND, message: 'Invoice not found.' }],
      warnings: [],
    };
  }


  // C2 — DRAFT only (also enforces idempotency: a SENT invoice cannot re-send).
  if (invoice.status !== 'DRAFT') {
    errors.push({
      code: INVOICE_SEND_ERRORS.NOT_DRAFT,
      message: `Only DRAFT invoices can be sent (current status: ${invoice.status}).`,
    });
  }

  // C3 — at least one line item.
  if (!invoice.items || invoice.items.length === 0) {
    errors.push({
      code: INVOICE_SEND_ERRORS.NO_LINE_ITEMS,
      message: 'Invoice has no line items.',
    });
  }

  // C4 — arithmetic integrity: line items sum to subtotal and total.
  const lineSum = roundMoney(
    (invoice.items ?? []).reduce((sum, i) => sum + decimalToNumber(i.lineTotal), 0)
  );
  const subtotal = decimalToNumber(invoice.subtotal);
  const tax = decimalToNumber(invoice.tax);
  const discount = decimalToNumber(invoice.discount);
  const total = decimalToNumber(invoice.total);
  const expectedTotal = roundMoney(Math.max(0, subtotal + tax - discount));
  if (lineSum !== subtotal || total !== expectedTotal) {
    errors.push({
      code: INVOICE_SEND_ERRORS.TOTAL_MISMATCH,
      message: `Invoice totals do not reconcile (line items ${lineSum}, subtotal ${subtotal}, total ${total}, expected ${expectedTotal}).`,
    });
  }

  // C5 — client email present.
  if (!invoice.clientEmail || invoice.clientEmail.trim() === '') {
    errors.push({
      code: INVOICE_SEND_ERRORS.NO_CLIENT_EMAIL,
      message: 'Invoice has no client email address.',
    });
  }

  // C8a — invoice-number identity conflict.
  if (input.invoiceNumberConflict) {
    errors.push({
      code: INVOICE_SEND_ERRORS.NUMBER_CONFLICT,
      message: `Invoice number ${invoice.invoiceNumber} is already used by another invoice.`,
    });
  }

  // Job-linked checks (C6, C6b, C7, C8-warning).
  if (job) {
    // C6 — property matches the job.
    if (normalize(invoice.propertyAddress) !== normalize(job.address)) {
      errors.push({
        code: INVOICE_SEND_ERRORS.JOB_PROPERTY_MISMATCH,
        message: 'Invoice property address does not match the linked job.',
      });
    }

    // C6b — customer identity matches the job.
    let customerMatches: boolean;
    if (invoice.customerId && job.customerId) {
      customerMatches = invoice.customerId === job.customerId;
    } else if (invoice.clientEmail && job.customerEmail) {
      customerMatches = normalize(invoice.clientEmail) === normalize(job.customerEmail);
    } else if (job.customerName) {
      customerMatches = normalize(invoice.clientName) === normalize(job.customerName);
    } else {
      // Nothing to contradict identity — do not manufacture a false mismatch.
      customerMatches = true;
    }
    if (!customerMatches) {
      errors.push({
        code: INVOICE_SEND_ERRORS.CUSTOMER_MISMATCH,
        message: 'Invoice customer does not match the linked job customer.',
      });
    }

    // C7 — service date matches (timezone-safe, date-only).
    if (invoice.jobDate && job.preferredDate && !isSameServiceDay(invoice.jobDate, job.preferredDate)) {
      errors.push({
        code: INVOICE_SEND_ERRORS.JOB_DATE_MISMATCH,
        message: 'Invoice service date does not match the linked job service date.',
      });
    }

    // C8 (warning) — invoice total differs from the job's quoted/booked total.
    // This is a warning, NOT the reimbursement gate: a legitimate difference
    // (reimbursements added) is expected. It can never *detect* a missing
    // reimbursement — that is what C8b (below) is for.
    const jobTotal = job.totalPrice != null || job.quotedTotal != null
      ? decimalToNumber(job.totalPrice ?? job.quotedTotal)
      : null;
    if (jobTotal != null && jobTotal !== total) {
      rawWarnings.push({
        code: INVOICE_SEND_WARNINGS.JOB_TOTAL_MISMATCH,
        message: `Invoice total (${total}) differs from the job total (${jobTotal}). Confirm reimbursements/adjustments are intended.`,
      });
    }
  }

  // C9 (error) / C10 (warning) — duplicate / near-duplicate sends.
  for (const sib of siblings) {
    if (sib.id === invoice.id) continue;
    if (!['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(sib.status)) continue;

    const sameDay =
      invoice.jobDate != null &&
      sib.jobDate != null &&
      isSameServiceDay(invoice.jobDate, sib.jobDate);

    if (sameDay) {
      // C9 — same customer + property + service date already invoiced.
      errors.push({
        code: INVOICE_SEND_ERRORS.DUPLICATE_SERVICE,
        message:
          'Another issued invoice already exists for this customer, property, and service date.',
      });
    } else if (
      sib.sentAt != null &&
      now.getTime() - sib.sentAt.getTime() <= RECENT_SEND_WINDOW_MS
    ) {
      // C10 — a *different* service date invoiced to this customer+property within 24h.
      rawWarnings.push({
        code: INVOICE_SEND_WARNINGS.RECENT_SEND_CONFLICT,
        message:
          'Another invoice was sent to this customer/property within the last 24 hours (different service date).',
      });
    }
  }

  // C8b — human reimbursement-completeness assertion (P4 honest gate).
  if (options?.reimbursementsConfirmed !== true) {
    errors.push({
      code: INVOICE_SEND_ERRORS.REIMBURSEMENTS_UNCONFIRMED,
      message:
        'You must confirm that all reimbursable expenses are represented as invoice lines, or that none exist.',
    });
  }

  // Resolve warnings against explicit acknowledgements (scoped to warnings only).
  const acknowledged = new Set(
    (options?.acknowledgeWarnings ?? []).filter((c) => OVERRIDABLE_WARNING_CODES.includes(c))
  );
  const dedupedWarnings = dedupe(rawWarnings);
  const unacknowledged = dedupedWarnings.filter((w) => !acknowledged.has(w.code));

  if (errors.length > 0) {
    // Report the blocking warnings (unacknowledged) alongside errors for context.
    return { ok: false, errors: dedupe(errors), warnings: unacknowledged };
  }
  if (unacknowledged.length > 0) {
    return { ok: false, errors: [], warnings: unacknowledged };
  }
  // ok — return the raised warnings (all acknowledged) so callers can audit them.
  return { ok: true, errors: [], warnings: dedupedWarnings };
}

function dedupe(findings: InvoiceSendFinding[]): InvoiceSendFinding[] {
  const seen = new Set<string>();
  const out: InvoiceSendFinding[] = [];
  for (const f of findings) {
    if (seen.has(f.code)) continue;
    seen.add(f.code);
    out.push(f);
  }
  return out;
}

/**
 * Load the invoice + linked job + sibling invoices and run the send gate.
 * This is the single entry point every send path should call.
 */
export async function validateInvoiceSendable(
  invoiceId: string,
  options?: {
    reimbursementsConfirmed?: boolean;
    acknowledgeWarnings?: string[];
    adminUserId?: string;
  }
): Promise<InvoiceSendValidationResult> {
  const invoiceRow = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      Job: {
        include: {
          Customer: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!invoiceRow) {
    return evaluateInvoiceSendable({
      invoice: null,
      job: null,
      siblings: [],
      invoiceNumberConflict: false,
      options,
    });
  }

  const invoice: EvaluableInvoice = {
    id: invoiceRow.id,
    invoiceNumber: invoiceRow.invoiceNumber,
    status: invoiceRow.status,
    clientEmail: invoiceRow.clientEmail,
    clientName: invoiceRow.clientName,
    customerId: invoiceRow.customerId,
    propertyAddress: invoiceRow.propertyAddress,
    jobDate: invoiceRow.jobDate,
    subtotal: decimalToNumber(invoiceRow.subtotal),
    tax: decimalToNumber(invoiceRow.tax),
    discount: decimalToNumber(invoiceRow.discount),
    total: decimalToNumber(invoiceRow.total),
    items: invoiceRow.items.map((i) => ({ lineTotal: decimalToNumber(i.lineTotal) })),
  };

  const jobRow = invoiceRow.Job;
  const job: EvaluableJob | null = jobRow
    ? {
        id: jobRow.id,
        address: jobRow.address,
        preferredDate: jobRow.preferredDate,
        totalPrice: jobRow.totalPrice != null ? decimalToNumber(jobRow.totalPrice) : null,
        quotedTotal: jobRow.quotedTotal != null ? decimalToNumber(jobRow.quotedTotal) : null,
        customerId: jobRow.customerId,
        customerEmail: jobRow.Customer?.email ?? null,
        customerName:
          jobRow.customerName ||
          [jobRow.Customer?.firstName, jobRow.Customer?.lastName].filter(Boolean).join(' ') ||
          null,
      }
    : null;

  // Sibling invoices: same customer (id or email) + same property, not this one,
  // in an issued state. Property is matched in JS to normalize casing/whitespace.
  const orClauses: Array<Record<string, unknown>> = [];
  if (invoiceRow.customerId) orClauses.push({ customerId: invoiceRow.customerId });
  if (invoiceRow.clientEmail) orClauses.push({ clientEmail: invoiceRow.clientEmail });

  let siblings: SiblingInvoice[] = [];
  if (orClauses.length > 0) {
    const rows = await prisma.invoice.findMany({
      where: {
        id: { not: invoiceRow.id },
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        OR: orClauses,
      },
      select: { id: true, status: true, jobDate: true, sentAt: true, propertyAddress: true },
    });
    const prop = normalize(invoiceRow.propertyAddress);
    siblings = rows
      .filter((r) => normalize(r.propertyAddress) === prop)
      .map((r) => ({ id: r.id, status: r.status, jobDate: r.jobDate, sentAt: r.sentAt }));
  }

  // Invoice-number identity conflict (defensive; invoiceNumber is @unique).
  const numberConflict = await prisma.invoice.count({
    where: { invoiceNumber: invoiceRow.invoiceNumber, id: { not: invoiceRow.id } },
  });

  return evaluateInvoiceSendable({
    invoice,
    job,
    siblings,
    invoiceNumberConflict: numberConflict > 0,
    options,
  });
}
