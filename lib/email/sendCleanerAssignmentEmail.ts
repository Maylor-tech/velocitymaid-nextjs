/**
 * Cleaner assignment email (Resend) — mirrors the existing WhatsApp
 * notification (lib/sendCleanerAssignment.ts) but adds the fields the
 * Workspace automation spec asked for that WhatsApp doesn't carry today:
 * expected duration, pay method, and a direct link to the cleaner's own
 * portal job page. Deliberately excludes: guest/customer payment
 * information, and anything beyond the property address a cleaner already
 * needs to do the job (no gate codes / access notes — those stay in the
 * cleaner portal itself, not in email).
 */
import { Resend } from 'resend';
import { colors } from '@/lib/brand/colors';
import { getResendFromEmail } from '@/lib/email/resendClient';

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CleanerAssignmentEmailParams {
  cleanerEmail: string;
  cleanerName: string;
  jobReference: string | null;
  serviceType: string;
  scheduledDate: string; // already formatted for display
  scheduledTime: string;
  address: string;
  expectedDurationMinutes?: number | null;
  payMethodLabel?: string | null; // e.g. "Zelle", "Cash" — never account details
  jobId: string;
}

export interface CleanerAssignmentEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

function cleanerPortalLink(jobId: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
  return `${base}/cleaner/jobs/${jobId}`;
}

export async function sendCleanerAssignmentEmail(
  params: CleanerAssignmentEmailParams
): Promise<CleanerAssignmentEmailResult> {
  const resend = getResend();
  if (!resend) return { sent: false, error: 'RESEND_API_KEY not configured' };
  if (!params.cleanerEmail) return { sent: false, error: 'Missing cleaner email' };

  const reference = params.jobReference || params.jobId;
  const portalLink = cleanerPortalLink(params.jobId);
  const safeName = escapeHtml(params.cleanerName || 'there');

  const detailRows: Array<[string, string]> = [
    ['Job', reference],
    ['Service', params.serviceType],
    ['Date', params.scheduledDate],
    ['Time', params.scheduledTime],
    ['Address', params.address],
  ];
  if (params.expectedDurationMinutes) {
    const hours = Math.round((params.expectedDurationMinutes / 60) * 10) / 10;
    detailRows.push(['Expected duration', `~${hours} hour${hours === 1 ? '' : 's'}`]);
  }
  if (params.payMethodLabel) {
    detailRows.push(['Pay method', params.payMethodLabel]);
  }

  const rowsHtml = detailRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:${colors.muted};font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:${colors.text};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: ${colors.text};">
      <h2 style="color: ${colors.primaryNavy}; margin-bottom: 8px;">New job assigned</h2>
      <p style="margin: 0 0 20px; color: ${colors.muted}; font-size: 14px;">Hi ${safeName}, you've been assigned a new cleaning job.</p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">${rowsHtml}</table>
      <a href="${escapeHtml(portalLink)}" style="display:inline-block;background:${colors.primaryCyan};color:${colors.primaryNavy};font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">Accept or decline this job →</a>
      <p style="margin: 20px 0 0; font-size: 12px; color: ${colors.muted};">
        Log in to the cleaner portal to accept, decline, or view full job details.
      </p>
    </div>
  `;

  const text = [
    `New job assigned`,
    ...detailRows.map(([label, value]) => `${label}: ${value}`),
    ``,
    `Accept or decline: ${portalLink}`,
  ].join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: params.cleanerEmail,
      subject: `New job assigned — ${params.serviceType} on ${params.scheduledDate}`,
      html,
      text,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    return { sent: false, error: message };
  }
}
