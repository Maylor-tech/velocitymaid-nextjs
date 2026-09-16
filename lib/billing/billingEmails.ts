import { resend, getResendFromEmail } from '@/lib/email/resendClient';
import type { SerializedCompletionReport } from './serializeCompletionReport';
import type { SerializedReceipt } from './serializeReceipt';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { escapeHtml, brandHtmlBlock } from '@/lib/billing/emailBrand';
import { requireGoogleReviewUrl } from '@/lib/reviews/googleReviewUrl';

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://velocitymaid.com';
}

function brandHtml(title: string, body: string): string {
  return brandHtmlBlock(title, body);
}

function firstNameFrom(clientName: string): string {
  const trimmed = clientName.trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] || 'there';
}

export async function sendCompletionReportEmail(
  report: SerializedCompletionReport,
  toEmail: string,
  clientName: string
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  const viewUrl = `${appBaseUrl()}/report/${report.publicToken}`;
  const pdfUrl = `${appBaseUrl()}/api/report/${report.publicToken}/pdf`;

  const html = brandHtml(
    `Completion Report ${report.reportNumber}`,
    `<h1 style="margin:0 0 12px;font-size:22px;color:#0F1C2E;">Your service completion report</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#0F1C2E;">Hi ${escapeHtml(clientName)},</p>
     <p style="margin:0 0 8px;font-size:15px;color:#0F1C2E;">Your cleaning at <strong>${escapeHtml(report.propertyAddress)}</strong> is complete.</p>
     <p style="margin:0 0 20px;font-size:15px;color:#0F1C2E;">Report #${escapeHtml(report.reportNumber)} · ${escapeHtml(report.serviceDateFormatted)}</p>
     <a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:#0F1C2E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;margin-right:8px;">View report</a>
     <a href="${escapeHtml(pdfUrl)}" style="display:inline-block;background:#00C2CB;color:#0F1C2E;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;">Download PDF</a>`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: toEmail,
    subject: `VelocityMaid Completion Report — ${report.propertyAddress}`,
    html,
  });
  return { sent: true };
}

export async function sendReceiptDocumentEmail(
  receipt: SerializedReceipt,
  invoice?: SerializedInvoice | null
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  if (!receipt.clientEmail) return { sent: false, skippedReason: 'No client email' };

  const receiptUrl = `${appBaseUrl()}/receipt/${receipt.publicToken}`;
  const html = brandHtml(
    `Receipt ${receipt.receiptNumber}`,
    `<h1 style="margin:0 0 12px;font-size:22px;color:#0F1C2E;">Payment receipt</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#0F1C2E;">Hi ${escapeHtml(receipt.clientName)},</p>
     <p style="margin:0 0 8px;font-size:15px;color:#0F1C2E;">We received <strong>${escapeHtml(receipt.amountFormatted)}</strong>${invoice ? ` toward invoice #${escapeHtml(invoice.invoiceNumber)}` : ''}.</p>
     <p style="margin:0 0 20px;font-size:15px;color:#0F1C2E;">Receipt #${escapeHtml(receipt.receiptNumber)}</p>
     <a href="${escapeHtml(receiptUrl)}" style="display:inline-block;background:#0F1C2E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;">View receipt</a>`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: receipt.clientEmail,
    subject: `VelocityMaid Receipt #${receipt.receiptNumber}`,
    html,
  });
  return { sent: true };
}

export async function sendReviewRequestAfterPayment(params: {
  toEmail: string;
  clientName: string;
  propertyAddress: string;
  jobId: string;
  branchSlug?: string | null;
  serviceLocation?: string | null;
}): Promise<{ sent: boolean; skippedReason?: string; reviewUrl?: string; market?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };

  const { market, url: googleReviewUrl } = requireGoogleReviewUrl({
    branchSlug: params.branchSlug,
    serviceLocation: params.serviceLocation,
    jobId: params.jobId,
  });

  const firstName = firstNameFrom(params.clientName);

  const html = brandHtml(
    'How did we do?',
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#0F1C2E;">Hi ${escapeHtml(firstName)},</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#0F1C2E;">Thank you for choosing VelocityMaid. We appreciate the opportunity to care for your property.</p>
     <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#0F1C2E;">If you have a moment, we&apos;d appreciate your feedback about your recent cleaning experience. You can leave us a Google review using the button below.</p>
     <a href="${escapeHtml(googleReviewUrl)}" style="display:inline-block;background:#0F1C2E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;">Leave a Google Review</a>
     <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#0F1C2E;">Thank you for trusting VelocityMaid.</p>
     <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#6B7280;">— The VelocityMaid Team</p>`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: params.toEmail,
    subject: 'Thank you for choosing VelocityMaid',
    html,
  });
  return { sent: true, reviewUrl: googleReviewUrl, market };
}
