import { resend, getResendFromEmail } from "@/lib/email/resendClient";
import { escapeHtml, brandHtmlBlock } from "@/lib/billing/emailBrand";

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://velocitymaid.com";
}

/**
 * Manual report-link email only. Does not send an invoice and is never called
 * from job completion.
 */
export async function sendJobReportLinkEmail(input: {
  toEmail: string;
  clientName: string;
  reportToken: string;
  propertyAddress: string;
  invoicePublicToken?: string | null;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: "RESEND_API_KEY not configured" };

  const reportUrl = `${appBaseUrl()}/report/${input.reportToken}`;
  const invoiceUrl = input.invoicePublicToken
    ? `${appBaseUrl()}/invoice/${input.invoicePublicToken}`
    : null;
  const invoiceBlock = invoiceUrl
    ? `<p style="margin:16px 0 0;"><a href="${escapeHtml(invoiceUrl)}">View invoice</a></p>`
    : "";

  const html = brandHtmlBlock(
    "Your cleaning report",
    `<p>Hello ${escapeHtml(input.clientName || "there")},</p>
     <p>The report for ${escapeHtml(input.propertyAddress)} is ready.</p>
     <p><a href="${escapeHtml(reportUrl)}">View cleaning report</a></p>
     ${invoiceBlock}`
  );

  const result = await resend.emails.send({
    from: getResendFromEmail(),
    to: input.toEmail,
    subject: `Cleaning report — ${input.propertyAddress}`,
    html,
  });

  if (result.error) {
    return { sent: false, skippedReason: result.error.message };
  }
  return { sent: true };
}
