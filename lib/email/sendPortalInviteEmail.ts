import { resend, getResendFromEmail } from "./resendClient";
import { logIntegrationEvent } from "@/lib/google/integrationLog";

export interface SendPortalInviteEmailParams {
  toEmail: string;
  toName: string;
  /** Public login page, e.g. https://velocitymaid.com/customer/login */
  loginUrl: string;
  /**
   * One-click secure access link (magic link). The customer portal is
   * passwordless, so this link both signs the client in and lets them set up
   * their account — it stands in for a "set your password" link.
   */
  accessLink: string;
}

export interface SendPortalInviteEmailResult {
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

function buildHtml(params: SendPortalInviteEmailParams): string {
  const { toName, loginUrl, accessLink } = params;
  const safeName = escapeHtml(toName?.trim() || "there");
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeAccessLink = escapeHtml(accessLink);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your VelocityMaid account is ready</title>
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
              <td style="padding:32px 40px 8px;text-align:center;">
                <h1 style="margin:0;color:${NAVY};font-size:24px;font-family:${FONT};">Your account is ready, ${safeName}.</h1>
                <p style="margin:12px 0 0;color:${MUTED};font-size:15px;font-family:${FONT};line-height:1.5;">
                  We've set up your VelocityMaid client portal. From there you can view your cleans,
                  photos, invoices, and manage your bookings — all in one place.
                </p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:24px 40px 8px;text-align:center;">
                <a href="${safeAccessLink}" style="display:inline-block;background:${CYAN};color:${NAVY};font-weight:700;font-family:${FONT};font-size:16px;text-decoration:none;padding:14px 32px;border-radius:8px;">Set up your account &rarr;</a>
                <p style="margin:16px 0 0;color:${MUTED};font-size:13px;font-family:${FONT};line-height:1.5;">
                  This secure one-click link signs you in and gets you started.
                  No password required.
                </p>
              </td>
            </tr>

            <!-- Login URL detail -->
            <tr>
              <td style="padding:16px 40px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SURFACE};border-radius:8px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="color:${MUTED};font-size:12px;font-family:${FONT};">Your login page</div>
                      <div style="margin-top:4px;"><a href="${safeLoginUrl}" style="color:${NAVY};font-size:14px;font-weight:600;font-family:${FONT};text-decoration:none;">${safeLoginUrl}</a></div>
                      <div style="color:${MUTED};font-size:12px;font-family:${FONT};margin-top:10px;">
                        Sign in any time with your email — we'll send a secure code.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:${NAVY};padding:24px 40px;text-align:center;">
                <div style="color:#ffffff;font-size:15px;font-weight:600;font-family:${FONT};">Welcome to VelocityMaid.</div>
                <div style="color:rgba(255,255,255,0.5);font-size:13px;font-family:${FONT};margin-top:8px;">(802) 733-5348 &middot; hello@velocitymaid.com &middot; velocitymaid.com</div>
                <div style="color:${CYAN};font-size:13px;font-weight:700;font-family:${FONT};margin-top:12px;letter-spacing:1px;">COME HOME TO CLEAN.</div>
              </td>
            </tr>
          </table>
          <div style="color:${MUTED};font-size:11px;font-family:${FONT};margin-top:12px;max-width:560px;line-height:1.5;">
            If you weren't expecting this invite, you can safely ignore this email.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Send the customer portal invite email.
 *
 * Resolves cleanly (does not throw) when RESEND_API_KEY is unset so callers
 * can treat email as best-effort.
 */
export async function sendPortalInviteEmail(
  params: SendPortalInviteEmailParams
): Promise<SendPortalInviteEmailResult> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }
  if (!params.toEmail) {
    return { sent: false, skippedReason: "Missing recipient email" };
  }

  const subject = "Your VelocityMaid account is ready";
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
        action: 'SEND_PORTAL_INVITE_EMAIL',
        provider: 'RESEND',
        status: 'FAILED',
        recipient: params.toEmail,
        templateKey: 'portal_invite',
        triggeredBy: 'admin',
        errorSummary: error.message,
      }).catch(() => {});
      return { sent: false, error: error.message };
    }
    logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_PORTAL_INVITE_EMAIL',
      provider: 'RESEND',
      status: 'SUCCESS',
      recipient: params.toEmail,
      templateKey: 'portal_invite',
      triggeredBy: 'admin',
    }).catch(() => {});
    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { sent: false, error: message };
  }
}
