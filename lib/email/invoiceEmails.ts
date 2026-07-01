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

export async function sendPaymentConfirmationEmail(params: {
  invoice: SerializedInvoice;
  amount: number;
  nextJobDate?: string | null;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  if (!params.invoice.clientEmail) {
    return { sent: false, skippedReason: 'No client email' };
  }

  const firstName =
    params.invoice.clientName.trim().split(/\s+/)[0] || params.invoice.clientName;
  const amountStr = formatUsd(params.amount);
  const paidDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const upcomingLine = params.nextJobDate
    ? `\n\nYour next scheduled service is ${params.nextJobDate} — we'll see you then.`
    : '';

  const text = `Hi ${firstName},

We've received your payment of ${amountStr} for ${params.invoice.serviceType} at ${params.invoice.propertyAddress}.

Invoice: ${params.invoice.invoiceNumber}
Date paid: ${paidDate}
Amount: ${amountStr}

You're all squared up. Thank you for choosing VelocityMaid.${upcomingLine}

Brian Maylor
VelocityMaid
(802) 733-5348
hello@velocitymaid.com

COME HOME TO CLEAN.`;

  const html = `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0F1C2E;">
  <div style="background:#0F1C2E;padding:20px 24px;border-radius:12px 12px 0 0;">
    <div style="color:#00C2CB;font-size:11px;font-weight:bold;letter-spacing:2px;">VELOCITYMAID</div>
    <div style="color:#fff;font-size:18px;font-weight:bold;margin-top:4px;">Payment received</div>
  </div>
  <div style="border:1px solid #E2E8F0;border-top:none;padding:24px;border-radius:0 0 12px 12px;background:#fff;">
    <p style="font-size:15px;line-height:1.6;">Hi ${firstName},</p>
    <p style="font-size:15px;line-height:1.6;">We've received your payment of <strong>${amountStr}</strong> for <strong>${params.invoice.serviceType}</strong> at ${params.invoice.propertyAddress}.</p>
    <table style="width:100%;font-size:14px;margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#6B7280;">Invoice</td><td style="padding:4px 0;font-weight:bold;">${params.invoice.invoiceNumber}</td></tr>
      <tr><td style="padding:4px 0;color:#6B7280;">Date paid</td><td style="padding:4px 0;font-weight:bold;">${paidDate}</td></tr>
      <tr><td style="padding:4px 0;color:#6B7280;">Amount</td><td style="padding:4px 0;font-weight:bold;color:#00C2CB;">${amountStr}</td></tr>
    </table>
    <p style="font-size:15px;line-height:1.6;">You're all squared up. Thank you for choosing VelocityMaid.</p>
    ${params.nextJobDate ? `<p style="font-size:14px;line-height:1.6;color:#374151;">Your next scheduled service is <strong>${params.nextJobDate}</strong> — we'll see you then.</p>` : ''}
    <p style="font-size:14px;line-height:1.6;margin-top:20px;">Brian Maylor<br/>VelocityMaid<br/>(802) 733-5348<br/>hello@velocitymaid.com</p>
    <p style="font-size:11px;font-weight:bold;letter-spacing:2px;color:#00C2CB;margin-top:16px;">COME HOME TO CLEAN.</p>
  </div>
</div>`;

  await resend.emails.send({
    from: getResendFromEmail(),
    to: params.invoice.clientEmail,
    subject: `Payment received — thank you, ${firstName}`,
    html,
    text,
  });
  return { sent: true };
}
