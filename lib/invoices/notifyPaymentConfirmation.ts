import type { InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { sendPaymentConfirmationEmail } from '@/lib/email/invoiceEmails';
import { formatInvoiceDate } from '@/lib/invoices/invoiceUtils';

/** Send branded payment confirmation when an invoice transitions to PAID. */
export async function notifyInvoicePaymentConfirmation(
  invoiceId: string,
  previousStatus: InvoiceStatus,
  paymentAmount: number
): Promise<void> {
  if (previousStatus === 'DRAFT' || previousStatus === 'PAID') return;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, payments: true },
  });
  if (!invoice || invoice.status !== 'PAID') return;

  let nextJobDate: string | null = null;
  if (invoice.customerId) {
    const nextJob = await prisma.job.findFirst({
      where: {
        customerId: invoice.customerId,
        archivedAt: null,
        status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
        preferredDate: { gt: new Date() },
        id: invoice.jobId ? { not: invoice.jobId } : undefined,
      },
      orderBy: { preferredDate: 'asc' },
      select: { preferredDate: true },
    });
    if (nextJob?.preferredDate) {
      nextJobDate = formatInvoiceDate(nextJob.preferredDate);
    }
  }

  const serialized = serializeInvoice(invoice);
  await sendPaymentConfirmationEmail({
    invoice: serialized,
    amount: paymentAmount,
    nextJobDate,
  }).catch((err) => {
    console.error('[notifyInvoicePaymentConfirmation]', err);
  });
}
