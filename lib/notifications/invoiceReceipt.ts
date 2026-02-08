/**
 * Invoice Receipt WhatsApp — sent once per payment after successful payment.
 * Uses audit log to prevent duplicates; skips silently if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'INVOICE_RECEIPT_SENT';

export interface InvoiceReceiptParams {
  /** Unique payment identifier (e.g. Stripe session.id or invoice.id) */
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  date: Date;
  receiptLink: string;
  /** Customer phone (E.164 or national); skips send if missing */
  customerPhone: string | null;
}

/**
 * Send invoice receipt to customer if not already sent for this payment.
 * Returns true if message was sent, false if skipped.
 */
export async function sendInvoiceReceiptForPayment(params: InvoiceReceiptParams): Promise<boolean> {
  const { paymentId, invoiceNumber, amount, date, receiptLink, customerPhone } = params;

  try {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'Payment',
        entityId: paymentId,
      },
    });
    if (existing) return false;

    const phone = customerPhone?.trim();
    if (!phone) return false;

    const amountStr = typeof amount === 'number' && Number.isFinite(amount)
      ? `$${amount.toFixed(2)}`
      : String(amount);
    const dateStr = date instanceof Date && !isNaN(date.getTime())
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : String(date);

    const message = [
      '🧾 Payment Received — Thank You!',
      '',
      `Invoice: ${invoiceNumber}`,
      `Amount: ${amountStr}`,
      `Date: ${dateStr}`,
      '',
      'View your receipt:',
      receiptLink,
      '',
      '— VelocityMaid',
    ].join('\n');

    sendWhatsAppMessage({ to: phone, message }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'Payment',
      entityId: paymentId,
      description: 'Invoice receipt WhatsApp sent to customer',
      changes: { sentAt: new Date().toISOString(), invoiceNumber },
    });
    return true;
  } catch (err) {
    console.error('[invoiceReceipt]', err);
    return false;
  }
}
