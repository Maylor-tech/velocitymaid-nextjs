import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { moneyOrNull, resolveCommercialAmount } from '@/lib/billing/commercialAmount';
import { computeBalanceDue, decimalToNumber } from '@/lib/invoices/invoiceUtils';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';

export type SyncZeroInvoiceResult =
  | {
      synced: true;
      invoice: ReturnType<typeof serializeInvoice>;
      previousTotal: number;
      nextTotal: number;
    }
  | {
      synced: false;
      reason: 'NO_INVOICE' | 'INVOICE_ALREADY_PRICED' | 'NO_COMMERCIAL_AMOUNT' | 'GENUINE_ZERO';
      invoice?: ReturnType<typeof serializeInvoice>;
    };

/**
 * Repair a silent $0 invoice when the Job already has a real commercial amount.
 * Does not change Job.paymentStatus. Does not send email.
 * Only runs when invoice.total is 0 and job quoted/total is > 0.
 */
export async function syncZeroInvoiceFromJobPrice(
  jobId: string
): Promise<SyncZeroInvoiceResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      Invoice: { include: { items: true, payments: true } },
    },
  });
  if (!job?.Invoice) {
    return { synced: false, reason: 'NO_INVOICE' };
  }

  const invoice = job.Invoice;
  const previousTotal = decimalToNumber(invoice.total);
  const commercial = resolveCommercialAmount({
    totalPrice: job.totalPrice,
    quotedTotal: job.quotedTotal,
  });

  if (previousTotal > 0) {
    return {
      synced: false,
      reason: 'INVOICE_ALREADY_PRICED',
      invoice: serializeInvoice(invoice),
    };
  }
  if (commercial == null) {
    return { synced: false, reason: 'NO_COMMERCIAL_AMOUNT' };
  }
  if (commercial <= 0) {
    return {
      synced: false,
      reason: 'GENUINE_ZERO',
      invoice: serializeInvoice(invoice),
    };
  }

  const jobPaid = moneyOrNull(job.amountPaid) ?? 0;
  const invoicePaid = decimalToNumber(invoice.amountPaid);
  const amountPaid = Math.max(jobPaid, invoicePaid);
  const balanceDue = computeBalanceDue(commercial, amountPaid);
  const paidInFull = balanceDue <= 0 && amountPaid > 0;
  const paidAt =
    invoice.paidAt ??
    job.paidAt ??
    job.balancePaidAt ??
    job.depositPaidAt ??
    (paidInFull ? new Date() : null);
  const stripeRef =
    job.balancePaymentIntentId ||
    job.depositPaymentIntentId ||
    null;
  const description = job.serviceType || 'Professional cleaning';

  const updated = await prisma.$transaction(async (tx) => {
    if (invoice.items.length === 0) {
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description,
          quantity: 1,
          unitPrice: commercial,
          lineTotal: commercial,
          sortOrder: 0,
        },
      });
    } else {
      const zeroItem = invoice.items.find((item) => decimalToNumber(item.lineTotal) === 0);
      const target = zeroItem ?? invoice.items[0];
      await tx.invoiceItem.update({
        where: { id: target.id },
        data: {
          description: target.description || description,
          quantity: 1,
          unitPrice: commercial,
          lineTotal: commercial,
        },
      });
    }

    const hasMatchingPayment = invoice.payments.some((payment) => {
      const amt = decimalToNumber(payment.amount);
      return amt === amountPaid || payment.transactionReference === stripeRef;
    });
    if (paidInFull && amountPaid > 0 && !hasMatchingPayment) {
      await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount: amountPaid,
          paymentMethod: 'STRIPE',
          paymentDate: paidAt ?? new Date(),
          transactionReference: stripeRef,
          notes: 'Backfilled from job Stripe payment onto a $0 invoice',
        },
      });
    }

    return tx.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotal: commercial,
        total: commercial,
        amountPaid,
        balanceDue,
        status: paidInFull ? 'PAID' : invoice.status,
        paidAt: paidInFull ? paidAt : invoice.paidAt,
        notes: invoice.notes,
      },
      include: { items: true, payments: true },
    });
  });

  await logAuditEntry({
    actorRole: 'SYSTEM',
    action: 'INVOICE_ZERO_SYNCED_FROM_JOB',
    entityType: 'Invoice',
    entityId: invoice.id,
    description: `Synced $0 invoice ${invoice.invoiceNumber} to job commercial amount`,
    changes: {
      jobId,
      previousTotal,
      nextTotal: commercial,
      amountPaid,
      balanceDue,
      status: updated.status,
    },
  });

  return {
    synced: true,
    invoice: serializeInvoice(updated),
    previousTotal,
    nextTotal: commercial,
  };
}
