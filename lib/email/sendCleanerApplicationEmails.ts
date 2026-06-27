import { resend, getResendFromEmail } from './resendClient';

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
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:24px 28px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">VelocityMaid</p>
          <p style="margin:6px 0 0;font-size:13px;color:${CYAN};">Come home to clean.</p>
        </td></tr>
        <tr><td style="padding:28px;">${body}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendCleanerApplicationConfirmationEmail(params: {
  toEmail: string;
  applicantName: string;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  }

  const name = escapeHtml(params.applicantName.trim() || 'there');
  const html = brandHtml(
    'Application received',
    `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Thank you for applying to VelocityMaid</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">Hi ${name},</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
       Your application has been received. Our team reviews every candidate carefully.
       If selected, the next step will be the <strong>VelocityMaid Certification Program</strong>.
     </p>
     <p style="margin:0;font-size:14px;color:${MUTED};">— The VelocityMaid Talent Team</p>`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: params.toEmail,
    subject: 'VelocityMaid Cleaner Application Received',
    html,
  });

  return { sent: true };
}

export async function sendCleanerApplicationInternalNotification(params: {
  applicantName: string;
  applicantEmail: string;
  branchName: string;
  applicationId: string;
  serviceAreas: string[];
}): Promise<{ sent: boolean; skippedReason?: string }> {
  const opsEmail =
    process.env.OPS_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.RESERVATIONS_EMAIL;

  if (!opsEmail) {
    return { sent: false, skippedReason: 'OPS_NOTIFICATION_EMAIL not configured' };
  }
  if (!resend) {
    return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  }

  const adminBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://velocitymaid.com';
  const reviewUrl = `${adminBase}/admin/cleaners/applications/${params.applicationId}`;

  const html = brandHtml(
    'New cleaner application',
    `<h1 style="margin:0 0 12px;font-size:20px;color:${NAVY};">New talent portal application</h1>
     <p style="margin:0 0 8px;font-size:14px;color:${NAVY};"><strong>Name:</strong> ${escapeHtml(params.applicantName)}</p>
     <p style="margin:0 0 8px;font-size:14px;color:${NAVY};"><strong>Email:</strong> ${escapeHtml(params.applicantEmail)}</p>
     <p style="margin:0 0 8px;font-size:14px;color:${NAVY};"><strong>Branch:</strong> ${escapeHtml(params.branchName)}</p>
     <p style="margin:0 0 16px;font-size:14px;color:${NAVY};"><strong>Areas:</strong> ${escapeHtml(params.serviceAreas.join(', ') || '—')}</p>
     <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;font-size:14px;">Review application</a>`
  );

  await resend.emails.send({
    from: getResendFromEmail(),
    to: opsEmail,
    subject: `New VelocityMaid Cleaner Application — ${params.applicantName}`,
    html,
  });

  return { sent: true };
}
