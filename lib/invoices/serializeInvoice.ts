import type { Invoice, InvoiceItem, InvoicePayment, InvoiceStatus } from '@prisma/client';
import {
  computeBalanceDue,
  decimalToNumber,
  deriveInvoiceStatus,
  formatInvoiceDate,
  formatUsd,
  INVOICE_STATUS_LABELS,
} from './invoiceUtils';

export type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  payments: InvoicePayment[];
};

export function serializeInvoice(invoice: InvoiceWithRelations) {
  const total = decimalToNumber(invoice.total);
  const amountPaid = decimalToNumber(invoice.amountPaid);
  const status = deriveInvoiceStatus({
    status: invoice.status,
    total,
    amountPaid,
    dueDate: invoice.dueDate,
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    publicToken: invoice.publicToken,
    jobId: invoice.jobId,
    customerId: invoice.customerId,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    clientPhone: invoice.clientPhone,
    propertyAddress: invoice.propertyAddress,
    serviceType: invoice.serviceType,
    jobDate: invoice.jobDate?.toISOString() ?? null,
    jobDateFormatted: formatInvoiceDate(invoice.jobDate),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    dueDateFormatted: formatInvoiceDate(invoice.dueDate),
    subtotal: decimalToNumber(invoice.subtotal),
    tax: decimalToNumber(invoice.tax),
    discount: decimalToNumber(invoice.discount),
    total,
    totalFormatted: formatUsd(total),
    amountPaid,
    amountPaidFormatted: formatUsd(amountPaid),
    balanceDue: computeBalanceDue(total, amountPaid),
    balanceDueFormatted: formatUsd(computeBalanceDue(total, amountPaid)),
    status,
    statusLabel: INVOICE_STATUS_LABELS[status as InvoiceStatus],
    notes: invoice.notes,
    sentAt: invoice.sentAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    items: invoice.items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        description: item.description,
        quantity: decimalToNumber(item.quantity),
        unitPrice: decimalToNumber(item.unitPrice),
        lineTotal: decimalToNumber(item.lineTotal),
        lineTotalFormatted: formatUsd(decimalToNumber(item.lineTotal)),
        unitPriceFormatted: formatUsd(decimalToNumber(item.unitPrice)),
      })),
    payments: invoice.payments
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
      .map((p) => ({
        id: p.id,
        amount: decimalToNumber(p.amount),
        amountFormatted: formatUsd(decimalToNumber(p.amount)),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate.toISOString(),
        paymentDateFormatted: formatInvoiceDate(p.paymentDate),
        transactionReference: p.transactionReference,
        notes: p.notes,
      })),
  };
}

export type SerializedInvoice = ReturnType<typeof serializeInvoice>;
