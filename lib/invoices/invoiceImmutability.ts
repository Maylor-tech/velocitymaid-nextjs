/**
 * Incident #001 — P2: invoice immutability.
 *
 * Principle (locked in the safeguard design spec): a sent invoice is an
 * accounting artifact, not a live database view. Once an invoice reaches an
 * accounting-locked state, its customer-facing/identity/financial fields can no
 * longer be mutated in place — financial changes must go through revision /
 * supersede (Phase 4), never a silent PATCH.
 *
 * This module is pure and side-effect free so it can be unit-tested and reused
 * by every write path (admin PATCH route, billing steps, etc.).
 */

import type { InvoiceStatus } from '@prisma/client';
import { decimalToNumber } from '@/lib/invoices/invoiceUtils';

/** Statuses whose invoices are considered issued / accounting-locked. */
export const ACCOUNTING_LOCKED_STATUSES: readonly InvoiceStatus[] = [
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
];

/**
 * The immutable customer artifact: fields that must not change after an invoice
 * is accounting-locked. These are exactly the values that appear on (or that
 * define the identity of) the document the customer received.
 */
export const LOCKED_CUSTOMER_FIELDS = [
  'invoiceNumber',
  'jobDate',
  'dueDate',
  'propertyAddress',
  'clientName',
  'clientEmail',
  'serviceType',
  'items',
  'subtotal',
  'tax',
  'discount',
  'total',
  'status',
] as const;

export type LockedInvoiceField = (typeof LOCKED_CUSTOMER_FIELDS)[number];

export class InvoiceImmutableError extends Error {
  readonly code = 'INVOICE_IMMUTABLE';
  readonly fields: LockedInvoiceField[];

  constructor(fields: LockedInvoiceField[]) {
    super(
      `Invoice is accounting-locked; the following fields cannot be edited: ${fields.join(
        ', '
      )}. Use a revision invoice instead.`
    );
    this.name = 'InvoiceImmutableError';
    this.fields = fields;
  }
}

/** Minimal shape of an invoice needed to evaluate the lock. */
export interface LockableInvoice {
  status: InvoiceStatus;
  sentAt: Date | null;
}

/**
 * True when an invoice is accounting-locked: either its status is one of the
 * issued statuses, or it carries a `sentAt` (belt-and-suspenders for legacy
 * rows whose status may have drifted).
 */
export function isAccountingLocked(invoice: LockableInvoice): boolean {
  if (ACCOUNTING_LOCKED_STATUSES.includes(invoice.status)) return true;
  if (invoice.sentAt != null) return true;
  return false;
}

/** Shape of the PATCH body fields this guard inspects. */
export interface InvoicePatch {
  clientName?: string;
  clientEmail?: string | null;
  propertyAddress?: string;
  serviceType?: string;
  jobDate?: string | null;
  dueDate?: string | null;
  tax?: number;
  discount?: number;
  items?: unknown[];
  status?: InvoiceStatus;
}

/** Existing invoice values used to detect *actual* changes (not no-op resubmits). */
export interface ExistingInvoiceValues {
  status: InvoiceStatus;
  clientName: string;
  clientEmail: string | null;
  propertyAddress: string;
  serviceType: string;
  jobDate: Date | null;
  dueDate: Date | null;
  tax: unknown;
  discount: unknown;
}

function normStr(v: string | null | undefined): string {
  return (v ?? '').trim();
}

function dateMs(v: Date | string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const d = typeof v === 'string' ? new Date(v) : v;
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Which locked fields does this patch actually change on the given invoice?
 *
 * Only *real* changes count — resubmitting an unchanged value (e.g. a full-form
 * PATCH that echoes the existing dueDate) is not treated as a mutation, so
 * legitimate notes/phone edits on a locked invoice are not falsely blocked.
 */
export function lockedFieldsTouchedBy(
  existing: ExistingInvoiceValues,
  patch: InvoicePatch
): LockedInvoiceField[] {
  const touched: LockedInvoiceField[] = [];

  // Any items array on a locked invoice is a financial edit attempt.
  if (Array.isArray(patch.items)) touched.push('items');

  if (patch.clientName !== undefined && normStr(patch.clientName) !== normStr(existing.clientName)) {
    touched.push('clientName');
  }
  if (patch.clientEmail !== undefined && normStr(patch.clientEmail) !== normStr(existing.clientEmail)) {
    touched.push('clientEmail');
  }
  if (
    patch.propertyAddress !== undefined &&
    normStr(patch.propertyAddress) !== normStr(existing.propertyAddress)
  ) {
    touched.push('propertyAddress');
  }
  if (patch.serviceType !== undefined && normStr(patch.serviceType) !== normStr(existing.serviceType)) {
    touched.push('serviceType');
  }
  if (patch.jobDate !== undefined && dateMs(patch.jobDate) !== dateMs(existing.jobDate)) {
    touched.push('jobDate');
  }
  if (patch.dueDate !== undefined && dateMs(patch.dueDate) !== dateMs(existing.dueDate)) {
    touched.push('dueDate');
  }
  if (patch.tax !== undefined && decimalToNumber(patch.tax) !== decimalToNumber(existing.tax)) {
    touched.push('tax');
  }
  if (
    patch.discount !== undefined &&
    decimalToNumber(patch.discount) !== decimalToNumber(existing.discount)
  ) {
    touched.push('discount');
  }
  if (patch.status !== undefined && patch.status !== existing.status) {
    touched.push('status');
  }

  return touched;
}

/**
 * Throws {@link InvoiceImmutableError} if a patch would mutate any locked field
 * of an accounting-locked invoice. No-ops on DRAFT invoices and on patches that
 * only touch always-editable fields (notes, clientPhone).
 */
export function assertInvoiceDraftEditable(
  existing: LockableInvoice & ExistingInvoiceValues,
  patch: InvoicePatch
): void {
  if (!isAccountingLocked(existing)) return;
  const touched = lockedFieldsTouchedBy(existing, patch);
  if (touched.length > 0) {
    throw new InvoiceImmutableError(touched);
  }
}
