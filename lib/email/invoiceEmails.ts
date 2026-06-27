import { resend, getResendFromEmail } from './resendClient';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { formatUsd } from '@/lib/invoices/invoiceUtils';

const NAVY = '#0F1C2E';
const CYAN = '#00C2CB';
const SURFACE = '#F4F6F9';
const MUTED = '#6B7280';
const FONT = "'Helvetica Neue', Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function brandHtml(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
<tr><td style="background:${NAVY};padding:24px 28px;">
<p style="margin:0;font-size:20px;font-weight:700;color:#fff;">VelocityMaid</p>
<p style="margin:6px 0 0;font-size:13px;color:${CYAN};">Come home to clean.</p>
</td></tr><tr><td style="padding:28px;">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

function invoiceSummaryBlock(invoice: SerializedInvoice, viewUrl: string): string {
  const items = invoice.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #E2E8F0;font-size:14px;color:${NAVY};">${escapeHtml(i.description)}</td>
<td style="padding:8px 0;border-bottom:1px solid #E2E8F0;font-size:14px;color:${NAVY};text-align:right;">${escapeHtml(i.lineTotalFormatted)}</td></tr>`
    )
    .join('');

  return `
    <p style="margin:0 0 8px;font-size:14px;color:${MUTED};">Invoice #${escapeHtml(invoice.invoiceNumber)}</p>
    <p style="margin:0 0 4px;font-size:14px;color:${NAVY};"><strong>Service:</strong> ${escapeHtml(invoice.serviceType)}</p>
    <p style="margin:0 0 4px;font-size:14px;color:${NAVY};"><strong>Property:</strong> ${escapeHtml(invoice.propertyAddress)}</p>
    <p style="margin:0 0 16px;font-size:14px;color:${NAVY};"><strong>Due:</strong> ${escapeHtml(invoice.dueDateFormatted)}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${items}</table>
    <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${NAVY};">Total: ${escapeHtml(invoice.totalFormatted)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:${NAVY};">Balance due: <strong>${escapeHtml(invoice.balanceDueFormatted)}</strong></p>
    <a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;">View invoice</a>`;
}

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
  const html = brandHtml(
    `Invoice ${invoice.invoiceNumber}`,
    `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Your VelocityMaid invoice</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">Hi ${escapeHtml(invoice.clientName)},</p>
     <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${NAVY};">Please find your invoice below. Thank you for choosing VelocityMaid.</p>
     ${invoiceSummaryBlock(invoice, viewUrl)}`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: invoice.clientEmail,
    subject: `VelocityMaid Invoice #${invoice.invoiceNumber}`,
    html,
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
  const html = brandHtml(
    `Receipt ${invoice.invoiceNumber}`,
    `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Payment received — thank you</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">Hi ${escapeHtml(invoice.clientName)},</p>
     <p style="margin:0 0 8px;font-size:15px;color:${NAVY};">We received <strong>${escapeHtml(formatUsd(paymentAmount))}</strong> toward invoice #${escapeHtml(invoice.invoiceNumber)}.</p>
     <p style="margin:0 0 20px;font-size:15px;color:${NAVY};">Remaining balance: <strong>${escapeHtml(invoice.balanceDueFormatted)}</strong></p>
     ${invoiceSummaryBlock(invoice, viewUrl)}`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: invoice.clientEmail,
    subject: `VelocityMaid Payment Receipt #${invoice.invoiceNumber}`,
    html,
  });
  return { sent: true };
}

export async function sendInvoiceReminderEmail(
  invoice: SerializedInvoice
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  if (!invoice.clientEmail) return { sent: false, skippedReason: 'No client email' };

  const viewUrl = `${appBaseUrl()}/invoice/${invoice.publicToken}`;
  const html = brandHtml(
    `Reminder ${invoice.invoiceNumber}`,
    `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Friendly payment reminder</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">Hi ${escapeHtml(invoice.clientName)},</p>
     <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${NAVY};">This is a reminder that invoice #${escapeHtml(invoice.invoiceNumber)} has an outstanding balance of <strong>${escapeHtml(invoice.balanceDueFormatted)}</strong>.</p>
     ${invoiceSummaryBlock(invoice, viewUrl)}`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: invoice.clientEmail,
    subject: `VelocityMaid Invoice Reminder #${invoice.invoiceNumber}`,
    html,
  });
  return { sent: true };
}
