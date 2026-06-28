import { resend, getResendFromEmail } from './resendClient';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { formatUsd } from '@/lib/invoices/invoiceUtils';
import {
  buildInvoiceBrandedEmailHtml,
  buildInvoiceBrandedEmailText,
} from './templates/invoiceBrandedEmail';

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://velocitymaid.com'
  );
}

export async function sendInvoiceSentEmail(
  invoice: SerializedInvoice
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  if (!invoice.clientEmail) return { sent: false, skippedReason: 'No client email' };

  const viewUrl = `${appBaseUrl()}/invoice/${invoice.publicToken}`;
  const html = buildInvoiceBrandedEmailHtml(invoice, { variant: 'sent', viewUrl });
  const text = buildInvoiceBrandedEmailText(invoice, { variant: 'sent', viewUrl });

  await resend.emails.send({
    from: getResendFromEmail(),
    to: invoice.clientEmail,
    subject: `VelocityMaid — Invoice ${invoice.invoiceNumber}`,
    html,
    text,
  });
  return { sent: true };
}

export async function sendInvoiceReceiptEmail(
  invoice: SerializedInvoice,
  paymentAmount: number
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  if (!invoice.clientEmail) return { sent: false, skippedReason: 'No client email' };

  const viewUrl = `${appBaseUrl()}/invoice/${invoice.publicToken}`;
  const html = buildInvoiceBrandedEmailHtml(invoice, {
    variant: 'receipt',
    viewUrl,
    paymentAmount,
  });
  const text = buildInvoiceBrandedEmailText(invoice, {
    variant: 'receipt',
    viewUrl,
    paymentAmount,
  });

  await resend.emails.send({
    from: getResendFromEmail(),
    to: invoice.clientEmail,
    subject: `VelocityMaid Payment Receipt — ${invoice.invoiceNumber}`,
    html,
    text,
  });
  return { sent: true };
}

export async function sendInvoiceReminderEmail(
  invoice: SerializedInvoice
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  if (!invoice.clientEmail) return { sent: false, skippedReason: 'No client email' };

  const viewUrl = `${appBaseUrl()}/invoice/${invoice.publicToken}`;
  const html = buildInvoiceBrandedEmailHtml(invoice, { variant: 'reminder', viewUrl });
  const text = buildInvoiceBrandedEmailText(invoice, { variant: 'reminder', viewUrl });

  await resend.emails.send({
    from: getResendFromEmail(),
    to: invoice.clientEmail,
    subject: `VelocityMaid Invoice Reminder — ${invoice.invoiceNumber}`,
    html,
    text,
  });
  return { sent: true };
}
