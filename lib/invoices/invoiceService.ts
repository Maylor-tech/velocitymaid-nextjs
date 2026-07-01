import type { InvoicePaymentMethod, InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  computeBalanceDue,
  computeSubtotal,
  computeTotal,
  decimalToNumber,
  deriveInvoiceStatus,
  lineTotal,
  type InvoiceLineInput,
} from './invoiceUtils';

export async function refreshInvoiceStatus(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') return;

  const total = decimalToNumber(invoice.total);
  const amountPaid = decimalToNumber(invoice.amountPaid);
  const next = deriveInvoiceStatus({
    status: invoice.status,
    total,
    amountPaid,
    dueDate: invoice.dueDate,
  });
  const balanceDue = computeBalanceDue(total, amountPaid);

  if (next !== invoice.status || decimalToNumber(invoice.balanceDue) !== balanceDue) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: next, balanceDue, updatedAt: new Date() },
    });
  }
}

export async function recordInvoicePayment(params: {
  invoiceId: string;
  amount: number;
  paymentMethod: InvoicePaymentMethod;
  paymentDate?: Date;
  transactionReference?: string;
  notes?: string;
  stripeSessionId?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { items: true, payments: true },
  });
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.status === 'CANCELLED') throw new Error('Cannot add payment to cancelled invoice');

  const amount = Math.max(0, params.amount);
  if (amount <= 0) throw new Error('Payment amount must be greater than zero');

  const previousStatus = invoice.status;

  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId: params.invoiceId,
      amount,
      paymentMethod: params.paymentMethod,
      paymentDate: params.paymentDate ?? new Date(),
      transactionReference: params.transactionReference ?? null,
      notes: params.notes ?? null,
      stripeSessionId: params.stripeSessionId ?? null,
    },
  });

  const newPaid = decimalToNumber(invoice.amountPaid) + amount;
  const total = decimalToNumber(invoice.total);
  const balanceDue = computeBalanceDue(total, newPaid);
  const baseStatus: InvoiceStatus =
    invoice.status === 'DRAFT' ? 'SENT' : invoice.status;
  const status = deriveInvoiceStatus({
    status: baseStatus,
    total,
    amountPaid: newPaid,
    dueDate: invoice.dueDate,
  });

  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: {
      amountPaid: newPaid,
      balanceDue,
      status,
      ...(status === 'PAID'
        ? { paidAt: invoice.paidAt ?? params.paymentDate ?? new Date() }
        : {}),
      updatedAt: new Date(),
    },
  });

  return { payment, previousStatus, becamePaid: status === 'PAID' && previousStatus !== 'PAID' };
}

/** After payment is recorded, create receipt + optional emails/review. */
export async function finalizeInvoicePayment(
  invoiceId: string,
  paymentId: string,
  amount: number,
  options?: { sendEmails?: boolean }
) {
  const { onInvoicePaymentRecorded } = await import('@/lib/billing/jobCompletionWorkflow');
  return onInvoicePaymentRecorded({
    invoiceId,
    paymentId,
    amount,
    sendEmails: options?.sendEmails,
  });
}

export function buildInvoiceAmounts(
  items: InvoiceLineInput[],
  tax: number,
  discount: number
) {
  const subtotal = computeSubtotal(items);
  const total = computeTotal(subtotal, tax, discount);
  return { subtotal, total, balanceDue: total };
}

export function mapItemsForCreate(items: InvoiceLineInput[]) {
  return items.map((item, index) => ({
    description: item.description.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: lineTotal(item.quantity, item.unitPrice),
    sortOrder: index,
  }));
}
