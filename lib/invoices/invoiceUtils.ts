import type { InvoiceStatus } from '@prisma/client';
import { nextVmReference } from '@/lib/billing/numbering';

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

export function computeSubtotal(items: InvoiceLineInput[]): number {
  return roundMoney(items.reduce((sum, i) => sum + lineTotal(i.quantity, i.unitPrice), 0));
}

export function computeTotal(subtotal: number, tax: number, discount: number): number {
  return roundMoney(Math.max(0, subtotal + tax - discount));
}

export function computeBalanceDue(total: number, amountPaid: number): number {
  return roundMoney(Math.max(0, total - amountPaid));
}

/** Derive status from amounts, due date, and workflow flags. */
export function deriveInvoiceStatus(params: {
  status: InvoiceStatus;
  total: number;
  amountPaid: number;
  dueDate: Date | null;
  now?: Date;
}): InvoiceStatus {
  const { status, total, amountPaid, dueDate } = params;
  const now = params.now ?? new Date();

  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'DRAFT') return 'DRAFT';

  const balance = computeBalanceDue(total, amountPaid);
  if (balance <= 0) return 'PAID';
  if (amountPaid > 0) {
    if (dueDate && now > endOfDay(dueDate)) return 'OVERDUE';
    return 'PARTIALLY_PAID';
  }
  if (dueDate && now > endOfDay(dueDate)) return 'OVERDUE';
  return status === 'SENT' || status === 'OVERDUE' || status === 'PARTIALLY_PAID' ? status : 'SENT';
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Returns the invoice number to use. If the invoice is linked to a job that
 * already has a jobReference (the normal case — minted once at job
 * creation), that same value is reused so the job and its invoice show the
 * identical VM-YYYY-#### code. Only mints a new number when there's no
 * existing reference to reuse (standalone invoices with no linked job).
 */
export async function nextInvoiceNumber(existingReference?: string | null): Promise<string> {
  if (existingReference) return existingReference;
  return nextVmReference();
}

export function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  return roundMoney(Number(value));
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-vm-surface text-vm-muted',
  SENT: 'bg-vm-cyan-tint text-vm-navy',
  PARTIALLY_PAID: 'bg-vm-warning-bg text-vm-warning',
  PAID: 'bg-vm-success-bg text-vm-success',
  OVERDUE: 'bg-vm-danger-bg text-vm-danger',
  CANCELLED: 'bg-gray-100 text-vm-muted',
};

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatInvoiceDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
