import { Resend } from "resend";
import { colors } from "@/lib/brand/colors";
import { getResendFromEmail } from "@/lib/email/resendClient";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface SendAdminChangeRequestEmailParams {
  toEmail: string;
  customerName: string;
  property: string;
  notes: string | null;
  jobId: string;
  requestedNewDate?: string | null;
  requestedNewTime?: string | null;
  requestedNewDuration?: number | null;
  requestedNewAddress?: string | null;
  jobLink?: string | null;
}

export interface SendAdminChangeRequestEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

export async function sendAdminChangeRequestEmail(
  params: SendAdminChangeRequestEmailParams
): Promise<SendAdminChangeRequestEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const {
    toEmail,
    customerName,
    property,
    notes,
    jobId,
    requestedNewDate,
    requestedNewTime,
    requestedNewDuration,
    requestedNewAddress,
    jobLink,
  } = params;

  const safeName = escapeHtml(customerName);
  const safeProperty = escapeHtml(property);

  const requestedRows: string[] = [];
  if (requestedNewDate) requestedRows.push(`New date: ${escapeHtml(requestedNewDate)}`);
  if (requestedNewTime) requestedRows.push(`New start time: ${escapeHtml(requestedNewTime)}`);
  if (requestedNewDuration) requestedRows.push(`New duration: ${requestedNewDuration} min`);
  if (requestedNewAddress) requestedRows.push(`Requested new address: ${escapeHtml(requestedNewAddress)}`);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${colors.text};">
      <h2 style="color: ${colors.primaryNavy}; margin-bottom: 8px;">Customer requested a change</h2>
      <p style="margin: 0 0 20px; color: ${colors.muted}; font-size: 14px;">
        Submitted through the customer portal.
      </p>

      <div style="background: ${colors.surface}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px; font-size: 13px; color: ${colors.muted};">Customer</p>
        <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: ${colors.primaryNavy};">${safeName}</p>

        <p style="margin: 0 0 6px; font-size: 13px; color: ${colors.muted};">Property</p>
        <p style="margin: 0 0 16px; font-size: 15px; color: ${colors.text};">${safeProperty}</p>

        ${
          notes
            ? `<p style="margin: 0 0 6px; font-size: 13px; color: ${colors.muted};">Note from customer</p>
               <p style="margin: 0; font-size: 15px; color: ${colors.text}; white-space: pre-wrap;">${escapeHtml(notes)}</p>`
            : `<p style="margin: 0; font-size: 14px; color: ${colors.muted};">(No note text was entered.)</p>`
        }
      </div>

      ${
        requestedRows.length > 0
          ? `<div style="border: 1px solid ${colors.primaryNavy}22; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
               <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: ${colors.primaryNavy};">Requested changes</p>
               <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: ${colors.text};">
                 ${requestedRows.map((r) => `<li style="margin-bottom: 4px;">${r}</li>`).join("")}
               </ul>
             </div>`
          : ""
      }

      ${
        jobLink
          ? `<p style="margin: 0 0 24px;">
               <a href="${escapeHtml(jobLink)}" style="color: ${colors.primaryNavy}; font-weight: 700; text-decoration: underline;">View job in admin →</a>
             </p>`
          : ""
      }

      <p style="font-size: 12px; color: ${colors.muted}; margin: 0;">Job ID: ${escapeHtml(jobId)}</p>
    </div>
  `;

  const text = [
    "Customer requested a change through the customer portal.",
    "",
    `Customer: ${customerName}`,
    `Property: ${property}`,
    notes ? `Note from customer: ${notes}` : "(No note text was entered.)",
    ...(requestedRows.length > 0 ? ["", "Requested changes:", ...requestedRows.map((r) => `- ${r}`)] : []),
    jobLink ? `\nView job in admin: ${jobLink}` : "",
    `\nJob ID: ${jobId}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: [toEmail],
      subject: `Change request — ${customerName}`,
      html,
      text,
    });
    if (error) {
      return { sent: false, error: error.message };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { sent: false, error: message };
  }
}
