/**
 * Cleaner job-offer email. Copy is an offer with expiry — not an assignment.
 * Never includes customer invoice totals or property access credentials.
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

export interface CleanerOfferEmailParams {
  cleanerEmail: string;
  cleanerName: string;
  jobReference: string | null;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  locationLabel: string;
  compensationAmount: number;
  compensationCurrency: string;
  expiresAt: Date;
  jobId: string;
  estimatedDurationMins?: number | null;
}

function cleanerPortalLink(jobId: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(
    /\/$/,
    ''
  );
  return `${base}/cleaner/jobs/${jobId}`;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatExpiry(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

export async function sendCleanerOfferEmail(
  params: CleanerOfferEmailParams
): Promise<{ sent: boolean; id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, error: 'RESEND_API_KEY not configured' };
  if (!params.cleanerEmail) return { sent: false, error: 'Missing cleaner email' };

  const reference = params.jobReference || params.jobId;
  const portalLink = cleanerPortalLink(params.jobId);
  const safeName = escapeHtml(params.cleanerName || 'there');
  const pay = formatMoney(params.compensationAmount, params.compensationCurrency);

  const detailRows: Array<[string, string]> = [
    ['Job', reference],
    ['Service', params.serviceType],
    ['Date', params.scheduledDate],
    ['Time', params.scheduledTime],
    ['Area', params.locationLabel],
    ['Your pay', pay],
    ['Respond by', formatExpiry(params.expiresAt)],
  ];
  if (params.estimatedDurationMins) {
    const hours = Math.round((params.estimatedDurationMins / 60) * 10) / 10;
    detailRows.push(['Expected duration', `~${hours} hour${hours === 1 ? '' : 's'}`]);
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
      <h2 style="color: ${colors.primaryNavy}; margin-bottom: 8px;">New job offer</h2>
      <p style="margin: 0 0 20px; color: ${colors.muted}; font-size: 14px;">Hi ${safeName}, you have a new cleaning job offer. This is not assigned to you until you accept.</p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">${rowsHtml}</table>
      <a href="${escapeHtml(portalLink)}" style="display:inline-block;background:${colors.primaryCyan};color:${colors.primaryNavy};font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;">Review offer in portal →</a>
      <p style="margin: 20px 0 0; font-size: 12px; color: ${colors.muted};">
        Log in to the cleaner portal to accept or decline. Access details are shown after you accept. This offer expires at the time above.
      </p>
    </div>
  `;

  const text = [
    `New job offer`,
    ...detailRows.map(([label, value]) => `${label}: ${value}`),
    ``,
    `Review and respond: ${portalLink}`,
    `This is an offer, not an assignment. Access details appear after you accept.`,
  ].join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: params.cleanerEmail,
      subject: `Job offer — ${params.serviceType} on ${params.scheduledDate}`,
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
