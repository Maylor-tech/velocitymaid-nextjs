import { resend, getResendFromEmail } from "./resendClient";
import { logIntegrationEvent } from "@/lib/google/integrationLog";

export { DEFAULT_GOOGLE_REVIEW_URL } from "@/lib/reviews/googleReviewUrl";

export interface SendReviewRequestEmailParams {
  toEmail: string;
  toName: string;
  /** Required: branch-resolved Google Business Profile review link. */
  reviewUrl: string;
}

export interface SendReviewRequestEmailResult {
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

const LOGO_SVG = `<svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="${CYAN}" fill-rule="evenodd" d="M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z" /></svg>`;

function buildHtml(params: SendReviewRequestEmailParams): string {
  const safeName = escapeHtml(
    (params.toName?.trim() || "there").split(/\s+/)[0] || "there"
  );
  const reviewUrl = escapeHtml(params.reviewUrl || "");
  if (!params.reviewUrl) {
    throw new Error(
      "sendReviewRequestEmail requires an explicit reviewUrl (branch-resolved Google review link)."
    );
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thank you for choosing VelocityMaid</title>
  </head>
  <body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
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

            <tr>
              <td style="padding:32px 40px 8px;">
                <p style="margin:0;color:${NAVY};font-size:15px;font-family:${FONT};line-height:1.6;">
                  Hi ${safeName},
                </p>
                <p style="margin:16px 0 0;color:${MUTED};font-size:15px;font-family:${FONT};line-height:1.6;">
                  Thank you for choosing VelocityMaid. We appreciate the opportunity to care for your property.
                </p>
                <p style="margin:16px 0 0;color:${MUTED};font-size:15px;font-family:${FONT};line-height:1.6;">
                  If you have a moment, we&apos;d appreciate your feedback about your recent cleaning experience. You can leave us a Google review using the button below.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 40px 16px;text-align:center;">
                <a href="${reviewUrl}" style="display:inline-block;background:${CYAN};color:${NAVY};font-weight:700;font-family:${FONT};font-size:16px;text-decoration:none;padding:14px 32px;border-radius:8px;">Leave a Google Review</a>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 40px 32px;">
                <p style="margin:0;color:${MUTED};font-size:15px;font-family:${FONT};line-height:1.6;">
                  Thank you for trusting VelocityMaid.
                </p>
                <p style="margin:12px 0 0;color:${MUTED};font-size:14px;font-family:${FONT};line-height:1.6;">
                  — The VelocityMaid Team
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:${NAVY};padding:24px 40px;text-align:center;">
                <div style="color:#ffffff;font-size:15px;font-weight:600;font-family:${FONT};">Thank you for choosing VelocityMaid.</div>
                <div style="color:rgba(255,255,255,0.5);font-size:13px;font-family:${FONT};margin-top:8px;">(802) 733-5348 &middot; hello@velocitymaid.com &middot; velocitymaid.com</div>
                <div style="color:${CYAN};font-size:13px;font-weight:700;font-family:${FONT};margin-top:12px;letter-spacing:1px;">COME HOME TO CLEAN</div>
              </td>
            </tr>
          </table>
          <div style="color:${MUTED};font-size:11px;font-family:${FONT};margin-top:12px;">You're receiving this because we recently completed a clean for you.</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Send the 3-day follow-up review request email.
 *
 * Resolves cleanly (does not throw) when RESEND_API_KEY is unset.
 */
export async function sendReviewRequestEmail(
  params: SendReviewRequestEmailParams
): Promise<SendReviewRequestEmailResult> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }
  if (!params.toEmail) {
    return { sent: false, skippedReason: "Missing recipient email" };
  }

  const subject = "Thank you for choosing VelocityMaid";
  const html = buildHtml(params);

  try {
    const { data, error } = await resend.emails.send({
      from: resolveFromEmail(),
      to: params.toEmail,
      subject,
      html,
    });
    if (error) {
      logIntegrationEvent({
        channel: 'EMAIL',
        action: 'SEND_REVIEW_REQUEST_EMAIL',
        provider: 'RESEND',
        status: 'FAILED',
        recipient: params.toEmail,
        templateKey: 'review_request',
        triggeredBy: 'cron',
        errorSummary: error.message,
      }).catch(() => {});
      return { sent: false, error: error.message };
    }
    logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_REVIEW_REQUEST_EMAIL',
      provider: 'RESEND',
      status: 'SUCCESS',
      recipient: params.toEmail,
      templateKey: 'review_request',
      triggeredBy: 'cron',
    }).catch(() => {});
    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { sent: false, error: message };
  }
}
