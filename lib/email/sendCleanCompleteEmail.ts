import { resend, getResendFromEmail } from "./resendClient";
import { prisma } from "@/lib/prisma";

export interface CleanCompletePhoto {
  url: string;
  caption?: string;
}

export interface SendCleanCompleteEmailParams {
  toEmail: string;
  toName: string;
  propertyAddress: string;
  cleanDate: Date;
  cleanDurationMins?: number;
  photos: CleanCompletePhoto[];
  invoiceAmount?: number;
  paypalEmail: string;
  market: "vermont" | "new-jersey";
  /** When provided, a 3-day follow-up review request is scheduled after send. */
  jobId?: string;
}

const REVIEW_FOLLOWUP_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Schedule a one-time review-request follow-up for 3 days out. Best-effort:
 * never throws, and de-dupes so re-notifying a job doesn't pile up requests.
 */
async function scheduleReviewRequest(
  jobId: string,
  clientEmail: string
): Promise<void> {
  try {
    const existing = await prisma.reviewRequest.findFirst({
      where: { jobId },
      select: { id: true },
    });
    if (existing) return;

    await prisma.reviewRequest.create({
      data: {
        jobId,
        clientEmail,
        scheduledFor: new Date(Date.now() + REVIEW_FOLLOWUP_DELAY_MS),
      },
    });
  } catch (err) {
    console.error("[review-request schedule]", err);
  }
}

export interface SendCleanCompleteEmailResult {
  sent: boolean;
  id?: string;
  skippedReason?: string;
  error?: string;
}

const NAVY = "#0F1C2E";
const CYAN = "#00C2CB";
const SURFACE = "#F4F6F9";
const MUTED = "#6B7280";
const FONT = "'Helvetica Neue', Arial, sans-serif";

/** notifications@ is preferred; falls back to RESEND_FROM_EMAIL / hello@. */
function resolveFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }
  return getResendFromEmail();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCleanDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(mins?: number): string | null {
  if (typeof mins !== "number" || !Number.isFinite(mins) || mins <= 0) {
    return null;
  }
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} min`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${minutes} min`;
}

function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

const LOGO_SVG = `<svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="${CYAN}" fill-rule="evenodd" d="M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z" /></svg>`;

function buildHtml(params: SendCleanCompleteEmailParams): string {
  const {
    toName,
    propertyAddress,
    cleanDate,
    cleanDurationMins,
    photos,
    invoiceAmount,
    paypalEmail,
  } = params;

  const safeName = escapeHtml(toName?.trim() || "there");
  const safeAddress = escapeHtml(propertyAddress?.trim() || "your property");
  const dateLabel = escapeHtml(formatCleanDate(cleanDate));
  const durationLabel = formatDuration(cleanDurationMins);
  const safePaypal = escapeHtml(paypalEmail);

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;">
        <div style="color:${MUTED};font-size:12px;font-family:${FONT};">${label}</div>
        <div style="color:${NAVY};font-size:14px;font-weight:600;font-family:${FONT};">${value}</div>
      </td>
    </tr>`;

  const detailRows = [
    detailRow("Property", safeAddress),
    dateLabel ? detailRow("Cleaned", dateLabel) : "",
    durationLabel ? detailRow("Duration", escapeHtml(durationLabel)) : "",
    detailRow("Cleaned by", "VelocityMaid Team"),
  ].join("");

  let photosSection = "";
  if (photos.length > 0) {
    const shown = photos.slice(0, 6);
    const remaining = photos.length - shown.length;

    // Build rows of two cells each.
    const rows: string[] = [];
    for (let i = 0; i < shown.length; i += 2) {
      const left = shown[i];
      const right = shown[i + 1];
      const leftCell = `
        <td width="50%" valign="top" style="padding:6px;">
          <img src="${escapeHtml(left.url)}" alt="Photo from your clean" style="display:block;width:100%;max-width:240px;border-radius:6px;" />
        </td>`;
      const rightCell = right
        ? `
        <td width="50%" valign="top" style="padding:6px;">
          <img src="${escapeHtml(right.url)}" alt="Photo from your clean" style="display:block;width:100%;max-width:240px;border-radius:6px;" />
        </td>`
        : `<td width="50%" style="padding:6px;"></td>`;
      rows.push(`<tr>${leftCell}${rightCell}</tr>`);
    }

    const moreNote =
      remaining > 0
        ? `<div style="padding:8px 40px 0;color:${MUTED};font-size:13px;font-family:${FONT};">and ${remaining} more photo${remaining > 1 ? "s" : ""} on file</div>`
        : "";

    photosSection = `
      <tr>
        <td style="padding:24px 40px 8px;">
          <div style="color:${NAVY};font-size:16px;font-weight:700;font-family:${FONT};">Photos from your clean</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 34px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            ${rows.join("")}
          </table>
        </td>
      </tr>
      ${moreNote ? `<tr><td>${moreNote}</td></tr>` : ""}`;
  }

  let paymentSection = "";
  if (typeof invoiceAmount === "number" && Number.isFinite(invoiceAmount)) {
    const amountLabel = escapeHtml(formatCurrency(invoiceAmount));
    const payLink = paypalEmail
      ? `https://www.paypal.com/paypalme/velocitymaid`
      : `https://paypal.me/velocitymaid`;
    paymentSection = `
      <tr>
        <td style="padding:24px 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${NAVY};border-radius:8px;">
            <tr>
              <td style="padding:24px;text-align:center;">
                <div style="color:#ffffff;font-size:20px;font-weight:700;font-family:${FONT};">Amount due: ${amountLabel}</div>
                <div style="color:rgba(255,255,255,0.7);font-size:14px;font-family:${FONT};margin-top:6px;">Send payment via PayPal to ${safePaypal}</div>
                <a href="${payLink}" style="display:inline-block;margin-top:18px;background:${CYAN};color:${NAVY};font-weight:700;font-family:${FONT};font-size:15px;text-decoration:none;padding:12px 28px;border-radius:6px;">Pay Now via PayPal</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your VelocityMaid clean is complete</title>
  </head>
  <body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <!-- Top banner -->
            <tr>
              <td style="background:${NAVY};padding:28px 40px;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">${LOGO_SVG}</td>
                    <td style="vertical-align:middle;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;font-family:${FONT};">VELOCITYMAID</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hero message -->
            <tr>
              <td style="padding:32px 40px;text-align:center;">
                <div style="width:56px;height:56px;line-height:56px;border-radius:50%;background:${CYAN};color:${NAVY};font-size:30px;font-weight:700;margin:0 auto 16px;text-align:center;">&#10003;</div>
                <h1 style="margin:0;color:${NAVY};font-size:24px;font-family:${FONT};">Your property is clean and guest-ready.</h1>
                <p style="margin:12px 0 0;color:${MUTED};font-size:15px;font-family:${FONT};line-height:1.5;">Your VelocityMaid team completed a full turnover at ${safeAddress}${dateLabel ? ` on ${dateLabel}` : ""}.</p>
              </td>
            </tr>

            <!-- Clean details box -->
            <tr>
              <td style="padding:0 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};border-radius:8px;">
                  <tr>
                    <td style="padding:20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${detailRows}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${photosSection}

            ${paymentSection}

            <!-- Footer -->
            <tr>
              <td style="background:${NAVY};padding:24px 40px;text-align:center;">
                <div style="color:#ffffff;font-size:15px;font-weight:600;font-family:${FONT};">Thank you for choosing VelocityMaid.</div>
                <div style="color:rgba(255,255,255,0.5);font-size:13px;font-family:${FONT};margin-top:8px;">(802) 733-5348 &middot; hello@velocitymaid.com &middot; velocitymaid.com</div>
                <div style="color:${CYAN};font-size:13px;font-weight:700;font-family:${FONT};margin-top:12px;letter-spacing:1px;">COME HOME TO CLEAN.</div>
              </td>
            </tr>
          </table>
          <div style="color:${MUTED};font-size:11px;font-family:${FONT};margin-top:12px;">Hi ${safeName}, this summary was sent because your clean was completed.</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Send the post-clean completion summary email to a client.
 *
 * Resolves cleanly (does not throw) when RESEND_API_KEY is unset so callers
 * can treat email as best-effort without crashing the completion flow.
 */
export async function sendCleanCompleteEmail(
  params: SendCleanCompleteEmailParams
): Promise<SendCleanCompleteEmailResult> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }

  if (!params.toEmail) {
    return { sent: false, skippedReason: "Missing recipient email" };
  }

  const subject = `Your VelocityMaid clean is complete — ${params.propertyAddress}`;
  const html = buildHtml(params);

  try {
    const { data, error } = await resend.emails.send({
      from: resolveFromEmail(),
      to: params.toEmail,
      subject,
      html,
    });

    if (error) {
      return { sent: false, error: error.message };
    }

    // Schedule the 3-day follow-up review request after a successful send.
    if (params.jobId) {
      await scheduleReviewRequest(params.jobId, params.toEmail);
    }

    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { sent: false, error: message };
  }
}
