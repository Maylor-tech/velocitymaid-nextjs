/**
 * Cleaner tip-received email (Resend).
 * Safe content only: own tip amount, property display name, job/service ref.
 * Never includes guestMessage, ServiceFeedback, Stay token, or guest identity.
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

export function formatTipAmountCents(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`;
}

export type CleanerTipReceivedEmailParams = {
  cleanerEmail: string;
  cleanerName: string;
  /** This cleaner's tip amount only (sole face value or own TipAllocation share). */
  amountCents: number;
  propertyDisplayName: string;
  jobReference: string | null;
};

export type CleanerTipReceivedEmailResult = {
  sent: boolean;
  id?: string;
  error?: string;
};

export async function sendCleanerTipReceivedEmail(
  params: CleanerTipReceivedEmailParams
): Promise<CleanerTipReceivedEmailResult> {
  const resend = getGuardedResend();
  if (!resend) return { sent: false, error: 'RESEND_API_KEY not configured' };
  if (!params.cleanerEmail) return { sent: false, error: 'Missing cleaner email' };
  const safety = resolveSafeEmailRecipient(params.cleanerEmail);
  if (!safety.allowed || !safety.to) {
    return { sent: false, error: safety.reason };
  }

  const amountLabel = formatTipAmountCents(params.amountCents);
  const safeName = escapeHtml(params.cleanerName || 'there');
  const propertyLabel = params.propertyDisplayName.trim() || 'a recent cleaning';
  const jobLabel = params.jobReference?.trim() || null;

  const detailRows: Array<[string, string]> = [
    ['Tip amount', amountLabel],
    ['Property', propertyLabel],
  ];
  if (jobLabel) {
    detailRows.push(['Job', jobLabel]);
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
      <h2 style="color: ${colors.primaryNavy}; margin-bottom: 8px;">A guest left you a tip</h2>
      <p style="margin: 0 0 20px; color: ${colors.muted}; font-size: 14px;">Hi ${safeName}, a guest tipped you for a recent cleaning.</p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">${rowsHtml}</table>
      <p style="margin: 0; font-size: 12px; color: ${colors.muted};">
        Tips are recorded for payout by VelocityMaid ops. This email does not transfer funds.
      </p>
    </div>
  `;

  const text = [
    `A guest left you a tip`,
    ...detailRows.map(([label, value]) => `${label}: ${value}`),
    ``,
    `Tips are recorded for payout by VelocityMaid ops. This email does not transfer funds.`,
  ].join('\n');

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: safety.to,
      subject: `Guest tip received — ${amountLabel}`,
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
