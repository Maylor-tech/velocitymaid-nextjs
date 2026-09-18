import { resend, getResendFromEmail } from '@/lib/email/resendClient';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import { feedbackPublicUrl } from '@/lib/feedback/serviceFeedback';

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

export type SendServiceFeedbackEmailParams = {
  toEmail: string;
  clientName: string;
  propertyLabel?: string | null;
  publicToken: string;
  isReminder?: boolean;
};

export type SendServiceFeedbackEmailResult = {
  sent: boolean;
  skippedReason?: string;
  error?: string;
  id?: string;
};

export async function sendServiceFeedbackRequestEmail(
  params: SendServiceFeedbackEmailParams
): Promise<SendServiceFeedbackEmailResult> {
  const toEmail = params.toEmail?.trim();
  if (!toEmail) {
    return { sent: false, skippedReason: 'No recipient email' };
  }

  if (!resend) {
    return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  }

  const firstName =
    (params.clientName?.trim() || 'there').split(/\s+/)[0] || 'there';
  const safeName = escapeHtml(firstName);
  const url = feedbackPublicUrl(params.publicToken);
  const safeUrl = escapeHtml(url);
  const property = params.propertyLabel
    ? escapeHtml(params.propertyLabel)
    : null;
  const isReminder = Boolean(params.isReminder);

  const subject = isReminder
    ? 'Quick reminder — how was your VelocityMaid experience?'
    : 'How was your VelocityMaid experience?';

  const intro = isReminder
    ? `Just a friendly reminder — we'd still love your private feedback on your recent VelocityMaid service.`
    : `Thank you for trusting VelocityMaid. We'd appreciate a quick private rating of your recent service experience.`;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:20px 24px;color:#fff;font-size:18px;font-weight:700;">VelocityMaid</td></tr>
        <tr><td style="padding:28px 24px;">
          <p style="margin:0 0 12px;color:${NAVY};font-size:20px;font-weight:700;">How was your VelocityMaid experience?</p>
          <p style="margin:0 0 16px;color:${MUTED};font-size:15px;line-height:1.5;">Hi ${safeName},</p>
          <p style="margin:0 0 16px;color:${MUTED};font-size:15px;line-height:1.5;">${intro}</p>
          ${
            property
              ? `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;">Property: <strong style="color:${NAVY};">${property}</strong></p>`
              : ''
          }
          <p style="margin:0 0 24px;color:${MUTED};font-size:14px;line-height:1.5;">This takes about a minute. Your answers help us improve — they are private to VelocityMaid (not a public Google review).</p>
          <a href="${safeUrl}" style="display:inline-block;background:${CYAN};color:${NAVY};text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Share feedback</a>
        </td></tr>
        <tr><td style="padding:16px 24px;background:${SURFACE};color:${MUTED};font-size:12px;">If the button does not work, open: ${safeUrl}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: toEmail,
      subject,
      html,
    });

    if (error) {
      await logIntegrationEvent({
        channel: 'EMAIL',
        action: 'SEND_SERVICE_FEEDBACK_EMAIL',
        provider: 'RESEND',
        status: 'FAILED',
        recipient: toEmail,
        templateKey: isReminder ? 'service_feedback_reminder' : 'service_feedback',
        triggeredBy: isReminder ? 'cron' : 'admin',
        errorSummary: error.message,
      });
      return { sent: false, error: error.message };
    }

    await logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_SERVICE_FEEDBACK_EMAIL',
      provider: 'RESEND',
      status: 'SUCCESS',
      recipient: toEmail,
      templateKey: isReminder ? 'service_feedback_reminder' : 'service_feedback',
      triggeredBy: isReminder ? 'cron' : 'admin',
    });

    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email send failed';
    return { sent: false, error: message };
  }
}
