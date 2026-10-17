import type { InvoicePayment, InvoicePaymentMethod, InvoiceStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { attributeInvoicePaymentAudit } from '@/lib/invoices/invoicePaymentAudit';
import {
  computeBalanceDue,
  computeSubtotal,
  computeTotal,
  decimalToNumber,
  deriveInvoiceStatus,
  lineTotal,
  type InvoiceLineInput,
} from './invoiceUtils';

/** External methods that must carry a confirmation / memo id for idempotency. */
export const EXTERNAL_REF_REQUIRED_METHODS: ReadonlySet<InvoicePaymentMethod> = new Set([
  'ZELLE',
  'VENMO',
  'BANK_TRANSFER',
  'CHECK',
]);

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export type RecordInvoicePaymentResult = {
  payment: InvoicePayment;
  previousStatus: InvoiceStatus;
  becamePaid: boolean;
  duplicate: boolean;
  clamped: boolean;
  remainingBefore: number;
  requestedAmount: number;
};

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
  actorId?: string | null;
  /** Admin routes pass ADMIN. Stripe webhooks omit this and stay SYSTEM. */
  actorRole?: 'ADMIN' | 'SYSTEM' | null;
}): Promise<RecordInvoicePaymentResult> {
  const requested = Math.max(0, params.amount);
  if (requested <= 0) throw new Error('Payment amount must be greater than zero');

  const stripeSessionId = params.stripeSessionId?.trim() || null;
  const transactionReference = params.transactionReference?.trim() || null;

  if (
    EXTERNAL_REF_REQUIRED_METHODS.has(params.paymentMethod) &&
    !transactionReference
  ) {
    throw new Error(
      `transactionReference is required for ${params.paymentMethod} payments`
    );
  }

  // Persistence boundaries (also docs/defects/FIN-001-payment-transaction-boundaries.md):
  // 1. This transaction commits the InvoicePayment and invoice totals, or rolls all of that back.
  // 2. Job sync runs after commit, under its own locks. A sync failure leaves the payment in place.
  // 3. Audit is appended after that and is never rolled back with the payment. A duplicate retry
  //    syncs the job again and appends another audit row; it does not delete the earlier one.
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${params.invoiceId} FOR UPDATE`;

    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId },
    });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') {
      throw new Error('Cannot add payment to cancelled invoice');
    }

    const previousStatus = invoice.status;
    const total = decimalToNumber(invoice.total);
    const alreadyPaid = decimalToNumber(invoice.amountPaid);
    const remaining = computeBalanceDue(total, alreadyPaid);

    const orFilters: Prisma.InvoicePaymentWhereInput[] = [];
    if (stripeSessionId) {
      orFilters.push({ stripeSessionId });
    }
    if (transactionReference) {
      orFilters.push({ transactionReference });
    }

    if (orFilters.length > 0) {
      const existing = await tx.invoicePayment.findFirst({
        where: { OR: orFilters },
      });
      if (existing) {
        return {
          payment: existing,
          previousStatus,
          becamePaid: false,
          duplicate: true as const,
          clamped: false as const,
          remainingBefore: remaining,
          requestedAmount: requested,
          status: invoice.status,
          balanceDue: computeBalanceDue(total, alreadyPaid),
          newPaid: alreadyPaid,
        };
      }
    }

    if (remaining <= 0) {
      throw new Error('Invoice is already paid in full');
    }

    const amount = Math.min(requested, remaining);
    const clamped = amount < requested;

    let payment: InvoicePayment;
    try {
      payment = await tx.invoicePayment.create({
        data: {
          invoiceId: params.invoiceId,
          amount,
          paymentMethod: params.paymentMethod,
          paymentDate: params.paymentDate ?? new Date(),
          transactionReference,
          notes: params.notes ?? null,
          stripeSessionId,
        },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await tx.invoicePayment.findFirst({
        where: {
          OR: [
            ...(stripeSessionId ? [{ stripeSessionId }] : []),
            ...(transactionReference ? [{ transactionReference }] : []),
          ],
        },
      });
      if (!raced) throw error;
      return {
        payment: raced,
        previousStatus,
        becamePaid: false,
        duplicate: true as const,
        clamped: false as const,
        remainingBefore: remaining,
        requestedAmount: requested,
        status: invoice.status,
        balanceDue: computeBalanceDue(total, alreadyPaid),
        newPaid: alreadyPaid,
      };
    }

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

    await tx.invoice.update({
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

    return {
      payment,
      previousStatus,
      becamePaid: status === 'PAID' && previousStatus !== 'PAID',
      duplicate: false as const,
      clamped,
      remainingBefore: remaining,
      requestedAmount: requested,
      status,
      balanceDue,
      newPaid,
    };
  });

  let syncFailed = false;
  let jobSync: 'failed' | 'repaired' | 'unchanged' = 'unchanged';
  try {
    const { syncJobPaymentFromInvoice } = await import('./syncJobPaymentFromInvoice');
    const synced = await syncJobPaymentFromInvoice(params.invoiceId);
    jobSync = synced?.changed ? 'repaired' : 'unchanged';
  } catch (err) {
    syncFailed = true;
    jobSync = 'failed';
    console.error('[recordInvoicePayment] job payment sync failed:', err);
  }

  if (!result.duplicate) {
    try {
      const { expireMismatchedInvoiceCheckoutSessions, balanceToCents } = await import(
        './invoiceCheckoutSession'
      );
      await expireMismatchedInvoiceCheckoutSessions({
        invoiceId: params.invoiceId,
        balanceCents: balanceToCents(result.balanceDue),
        keepStripeSessionId: stripeSessionId,
        reason: result.balanceDue <= 0 ? 'EXPIRED' : 'SUPERSEDED',
      });
    } catch (err) {
      console.error(
        '[recordInvoicePayment] failed to expire mismatched checkout sessions:',
        err
      );
    }
  }

  const attribution = attributeInvoicePaymentAudit({
    actorId: params.actorId,
    actorRole: params.actorRole,
  });

  await logAuditEntry({
    actorId: attribution.actorId,
    actorRole: attribution.actorRole,
    action: result.duplicate
      ? 'INVOICE_PAYMENT_IDEMPOTENT'
      : result.clamped
        ? 'INVOICE_PAYMENT_CLAMPED'
        : 'INVOICE_PAYMENT_RECORDED',
    entityType: 'Invoice',
    entityId: params.invoiceId,
    description: result.duplicate
      ? `Duplicate payment ignored for invoice ${params.invoiceId}`
      : `Recorded ${params.paymentMethod} payment $${Number(result.payment.amount).toFixed(2)} on invoice ${params.invoiceId}`,
    changes: {
      paymentId: result.payment.id,
      paymentMethod: params.paymentMethod,
      amount: Number(result.payment.amount),
      requestedAmount: result.requestedAmount,
      duplicate: result.duplicate,
      clamped: result.clamped,
      stripeSessionId,
      transactionReference,
      previousStatus: result.previousStatus,
      status: result.status,
      amountPaid: result.newPaid,
      balanceDue: result.balanceDue,
      ...(attribution.unresolvedActorId
        ? { unresolvedActorId: attribution.unresolvedActorId }
        : {}),
      jobSync,
      ...(syncFailed ? { syncFailed: true } : {}),
    },
  });

  if (syncFailed) {
    throw new Error('Invoice payment was recorded but job payment sync failed');
  }

  return {
    payment: result.payment,
    previousStatus: result.previousStatus,
    becamePaid: result.becamePaid,
    duplicate: result.duplicate,
    clamped: result.clamped,
    remainingBefore: result.remainingBefore,
    requestedAmount: result.requestedAmount,
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
