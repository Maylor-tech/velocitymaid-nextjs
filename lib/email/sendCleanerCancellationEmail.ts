/**
 * Cleaner job-cancellation email (Resend).
 *
 * Sent when a cleaner who had accepted / been assigned is released because
 * the job was cancelled. Deliberately excludes access credentials, alarm
 * notes, customer payment totals, and compensation / cancellation-pay claims.
 */
import { colors } from '@/lib/brand/colors';
import { getGuardedResend, getResendFromEmail } from '@/lib/email/resendClient';
import { resolveSafeEmailRecipient } from '@/lib/notifications/outboundSafety';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface CleanerCancellationEmailParams {
  cleanerEmail: string;
  cleanerName: string;
  jobReference: string | null;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  /** Area / town label only — not a street address with access detail. */
  locationLabel: string;
  jobId: string;
}

export interface CleanerCancellationEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

export async function sendCleanerCancellationEmail(
  params: CleanerCancellationEmailParams
): Promise<CleanerCancellationEmailResult> {
  const resend = getGuardedResend();
  if (!resend) return { sent: false, error: 'RESEND_API_KEY not configured' };
  if (!params.cleanerEmail) return { sent: false, error: 'Missing cleaner email' };

  const safety = resolveSafeEmailRecipient(params.cleanerEmail);
  if (!safety.allowed || !safety.to) {
    return { sent: false, error: safety.reason };
  }

  const reference = params.jobReference || params.jobId;
  const safeName = escapeHtml(params.cleanerName || 'there');

  const detailRows: Array<[string, string]> = [
    ['Job', reference],
    ['Service', params.serviceType],
    ['Date', params.scheduledDate],
    ['Time', params.scheduledTime],
    ['Area', params.locationLabel],
  ];

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
      <h2 style="color: ${colors.primaryNavy}; margin-bottom: 8px;">Job cancelled</h2>
      <p style="margin: 0 0 16px; color: ${colors.muted}; font-size: 14px;">Hi ${safeName},</p>
      <p style="margin: 0 0 16px; color: ${colors.text}; font-size: 14px; line-height: 1.5;">
        The following VelocityMaid job has been cancelled:
      </p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">${rowsHtml}</table>
      <p style="margin: 0 0 12px; color: ${colors.text}; font-size: 14px; line-height: 1.5;">
        <strong>No service is required for this job. Please do not travel to the property.</strong>
      </p>
      <p style="margin: 0 0 12px; color: ${colors.text}; font-size: 14px; line-height: 1.5;">
        The job has been removed from your active work in the cleaner portal.
      </p>
      <p style="margin: 0 0 20px; color: ${colors.muted}; font-size: 14px; line-height: 1.5;">
        If you have any questions, please contact VelocityMaid.
      </p>
      <p style="margin: 0; color: ${colors.muted}; font-size: 13px;">
        Thank you,<br/>VelocityMaid
      </p>
    </div>
  `;

  const text = [
    `Hi ${params.cleanerName || 'there'},`,
    ``,
    `The following VelocityMaid job has been cancelled:`,
    ...detailRows.map(([label, value]) => `${label}: ${value}`),
    ``,
    `No service is required for this job. Please do not travel to the property.`,
    `The job has been removed from your active work in the cleaner portal.`,
    ``,
    `If you have any questions, please contact VelocityMaid.`,
    ``,
    `Thank you,`,
    `VelocityMaid`,
  ].join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: safety.to,
      subject: `Job cancelled — ${params.serviceType} on ${params.scheduledDate}`,
      html,
      text,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Failed to send cancellation email',
    };
  }
}
