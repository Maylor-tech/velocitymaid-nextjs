import type { Receipt } from '@prisma/client';
import { decimalToNumber, formatInvoiceDate, formatUsd } from '@/lib/invoices/invoiceUtils';
import { brandedDocumentShell, documentHeader, escapeHtml } from './documentHtml';

export function serializeReceipt(receipt: Receipt) {
  const amount = decimalToNumber(receipt.amount);
  return {
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    publicToken: receipt.publicToken,
    invoiceId: receipt.invoiceId,
    jobId: receipt.jobId,
    customerId: receipt.customerId,
    clientName: receipt.clientName,
    clientEmail: receipt.clientEmail,
    amount,
    amountFormatted: formatUsd(amount),
    paymentMethod: receipt.paymentMethod,
    paymentDate: receipt.paymentDate.toISOString(),
    paymentDateFormatted: formatInvoiceDate(receipt.paymentDate),
    propertyAddress: receipt.propertyAddress,
    serviceType: receipt.serviceType,
    invoiceNumber: receipt.invoiceNumber,
    status: receipt.status,
    sentAt: receipt.sentAt?.toISOString() ?? null,
    createdAt: receipt.createdAt.toISOString(),
  };
}

export type SerializedReceipt = ReturnType<typeof serializeReceipt>;

export function renderReceiptHtml(receipt: SerializedReceipt): string {
  const body = `${documentHeader('Payment Receipt', receipt.receiptNumber)}
<div class="content">
  <div class="grid">
    <div>
      <p class="label">Received from</p>
      <p class="value">${escapeHtml(receipt.clientName)}</p>
      ${receipt.clientEmail ? `<p class="value" style="color:#6B7280;font-size:14px;">${escapeHtml(receipt.clientEmail)}</p>` : ''}
    </div>
    <div>
      <p class="label">Payment date</p>
      <p class="value">${escapeHtml(receipt.paymentDateFormatted)}</p>
    </div>
    ${receipt.propertyAddress ? `<div><p class="label">Property</p><p class="value">${escapeHtml(receipt.propertyAddress)}</p></div>` : '<div></div>'}
    ${receipt.serviceType ? `<div><p class="label">Service</p><p class="value">${escapeHtml(receipt.serviceType)}</p></div>` : ''}
  </div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${escapeHtml(receipt.invoiceNumber ? `Payment for invoice #${receipt.invoiceNumber}` : 'VelocityMaid service payment')}</td>
        <td class="amount">${escapeHtml(receipt.amountFormatted)}</td>
      </tr>
      <tr class="total-row"><td>Total paid</td><td class="amount">${escapeHtml(receipt.amountFormatted)}</td></tr>
    </tbody>
  </table>
  <p class="value" style="margin-top:16px;font-size:13px;color:#6B7280;">Payment method: ${escapeHtml(receipt.paymentMethod.replace(/_/g, ' '))}</p>
</div>
<div class="footer">Thank you for choosing VelocityMaid · velocitymaid.com</div>`;

  return brandedDocumentShell(`Receipt ${receipt.receiptNumber}`, body);
}
