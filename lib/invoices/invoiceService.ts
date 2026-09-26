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

  if (params.stripeSessionId) {
    const existingSession = await prisma.invoicePayment.findFirst({
      where: { stripeSessionId: params.stripeSessionId },
    });
    if (existingSession) {
      return {
        payment: existingSession,
        previousStatus: invoice.status,
        becamePaid: false,
        duplicate: true as const,
        clamped: false as const,
        remainingBefore: computeBalanceDue(
          decimalToNumber(invoice.total),
          decimalToNumber(invoice.amountPaid)
        ),
        requestedAmount: Math.max(0, params.amount),
      };
    }
  }

  const total = decimalToNumber(invoice.total);
  const alreadyPaid = decimalToNumber(invoice.amountPaid);
  const remaining = computeBalanceDue(total, alreadyPaid);
  if (remaining <= 0) {
    throw new Error('Invoice is already paid in full');
  }

  const requested = Math.max(0, params.amount);
  if (requested <= 0) throw new Error('Payment amount must be greater than zero');

  // Clamp so manual Zelle/other + Stripe cannot silently overpay the invoice ledger.
  const amount = Math.min(requested, remaining);
  const clamped = amount < requested;

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

  const newPaid = alreadyPaid + amount;
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

  const { syncJobPaymentFromInvoice } = await import('./syncJobPaymentFromInvoice');
  await syncJobPaymentFromInvoice(params.invoiceId);

  // Expire stale Checkout sessions whose amount no longer matches unpaid balance.
  // Keep the completing Stripe session (if any) so webhook can mark it COMPLETED.
  try {
    const { expireMismatchedInvoiceCheckoutSessions, balanceToCents } = await import(
      './invoiceCheckoutSession'
    );
    await expireMismatchedInvoiceCheckoutSessions({
      invoiceId: params.invoiceId,
      balanceCents: balanceToCents(balanceDue),
      keepStripeSessionId: params.stripeSessionId ?? null,
      reason: balanceDue <= 0 ? 'EXPIRED' : 'SUPERSEDED',
    });
  } catch (err) {
    console.error(
      '[recordInvoicePayment] failed to expire mismatched checkout sessions:',
      err
    );
  }

  return {
    payment,
    previousStatus,
    becamePaid: status === 'PAID' && previousStatus !== 'PAID',
    duplicate: false as const,
    clamped,
    remainingBefore: remaining,
    requestedAmount: requested,
  };
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
