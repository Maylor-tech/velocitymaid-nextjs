'use client';

import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { INVOICE_STATUS_CLASSES } from '@/lib/invoices/invoiceUtils';

interface InvoiceDocumentProps {
  invoice: SerializedInvoice;
  showStatus?: boolean;
}

export function InvoiceDocument({ invoice, showStatus = true }: InvoiceDocumentProps) {
  return (
    <div className="invoice-document mx-auto max-w-3xl rounded-2xl border border-vm-border bg-vm-white shadow-sm print:shadow-none">
      <div className="rounded-t-2xl bg-vm-navy px-8 py-6 print:rounded-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-heading text-2xl font-bold text-vm-white">VelocityMaid</p>
            <p className="mt-1 font-body text-sm text-vm-cyan">Come Home to Clean</p>
          </div>
          <div className="text-right">
            <p className="font-heading text-lg font-bold text-vm-white">INVOICE</p>
            <p className="font-body text-sm text-vm-white/80">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-8 py-6">
        {showStatus && (
          <div className="flex justify-end">
            <span
              className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${INVOICE_STATUS_CLASSES[invoice.status]}`}
            >
              {invoice.statusLabel}
            </span>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">Bill to</p>
            <p className="mt-1 font-heading text-base font-semibold text-vm-navy">{invoice.clientName}</p>
            {invoice.clientEmail && (
              <p className="font-body text-sm text-vm-text">{invoice.clientEmail}</p>
            )}
            {invoice.clientPhone && (
              <p className="font-body text-sm text-vm-text">{invoice.clientPhone}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="font-body text-sm text-vm-muted">
              <span className="font-semibold text-vm-navy">Service date:</span>{' '}
              {invoice.jobDateFormatted}
            </p>
            <p className="font-body text-sm text-vm-muted">
              <span className="font-semibold text-vm-navy">Due date:</span> {invoice.dueDateFormatted}
            </p>
            <p className="mt-2 font-body text-sm text-vm-text">{invoice.propertyAddress}</p>
          </div>
        </div>

        <div>
          <p className="font-heading text-sm font-semibold text-vm-navy">{invoice.serviceType}</p>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-vm-border">
              <th className="py-2 text-left font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">
                Description
              </th>
              <th className="py-2 text-right font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">
                Qty
              </th>
              <th className="py-2 text-right font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">
                Rate
              </th>
              <th className="py-2 text-right font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-vm-border/60">
                <td className="py-3 font-body text-sm text-vm-text">{item.description}</td>
                <td className="py-3 text-right font-body text-sm text-vm-text">{item.quantity}</td>
                <td className="py-3 text-right font-body text-sm text-vm-text">{item.unitPriceFormatted}</td>
                <td className="py-3 text-right font-body text-sm font-medium text-vm-navy">
                  {item.lineTotalFormatted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-2">
          <div className="flex justify-between font-body text-sm text-vm-muted">
            <span>Subtotal</span>
            <span>{invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.tax > 0 && (
            <div className="flex justify-between font-body text-sm text-vm-muted">
              <span>Tax</span>
              <span>{invoice.tax.toFixed(2)}</span>
            </div>
          )}
          {invoice.discount > 0 && (
            <div className="flex justify-between font-body text-sm text-vm-muted">
              <span>Discount</span>
              <span>-{invoice.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-vm-border pt-2 font-heading text-base font-bold text-vm-navy">
            <span>Total</span>
            <span>{invoice.totalFormatted}</span>
          </div>
          <div className="flex justify-between font-body text-sm text-vm-success">
            <span>Paid</span>
            <span>{invoice.amountPaidFormatted}</span>
          </div>
          <div className="flex justify-between font-heading text-lg font-bold text-vm-navy">
            <span>Balance due</span>
            <span>{invoice.balanceDueFormatted}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="rounded-lg bg-vm-surface p-4">
            <p className="font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">Notes</p>
            <p className="mt-1 whitespace-pre-wrap font-body text-sm text-vm-text">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
