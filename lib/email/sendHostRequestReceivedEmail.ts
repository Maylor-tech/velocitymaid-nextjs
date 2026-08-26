import { resend, getResendFromEmail } from './resendClient';
import { formatServiceDate } from '@/lib/dates/serviceDate';

const NAVY = '#0F1C2E';
const CYAN = '#00C2CB';
const SURFACE = '#F4F6F9';
const FONT = "'Helvetica Neue', Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type HostRequestReceivedInput = {
  to: string;
  customerFirstName: string;
  propertyName?: string | null;
  address: string;
  preferredDate: Date | string | null;
  preferredTime: string | null;
  serviceType: string;
  jobReference: string | null;
  jobId: string;
};

export type HostRequestReceivedSendResult = {
  sent: boolean;
  skippedReason?: string;
  provider?: 'RESEND';
  messageId?: string | null;
};

/**
 * Immediate "Request Received" email after a host-portal Job is created.
 * Never throws — callers must not fail HTTP on email errors.
 */
export async function sendHostRequestReceivedEmail(
  input: HostRequestReceivedInput
): Promise<HostRequestReceivedSendResult> {
  if (!resend) {
    return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  }
  if (!input.to) {
    return { sent: false, skippedReason: 'No customer email' };
  }

  const firstName = escapeHtml(input.customerFirstName || 'there');
  const dateLabel =
    formatServiceDate(input.preferredDate, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) || 'the requested date';
  const timeLabel = input.preferredTime?.trim() || 'the requested time';
  const address = escapeHtml(input.address);
  const serviceType = escapeHtml(input.serviceType);
  const ref = input.jobReference
    ? escapeHtml(input.jobReference)
    : escapeHtml(input.jobId.slice(-6).toUpperCase());

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Request Received</title></head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:${FONT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:24px 28px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">VelocityMaid</p>
          <p style="margin:6px 0 0;font-size:13px;color:${CYAN};">Come home to clean.</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
            Hi ${firstName}, we received your cleaning request.
          </p>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${NAVY};">
            <strong>Service:</strong> ${serviceType}<br/>
            <strong>When:</strong> ${escapeHtml(dateLabel)} at ${escapeHtml(timeLabel)}<br/>
            <strong>Where:</strong> ${address}<br/>
            <strong>Reference:</strong> ${ref}
          </p>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:${NAVY};">
            Our team will confirm the schedule shortly. You can follow this request anytime under My Jobs in your portal.
          </p>
          <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:${NAVY};">
            — VelocityMaid
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Hi ${input.customerFirstName || 'there'}, we received your cleaning request.

Service: ${input.serviceType}
When: ${dateLabel} at ${timeLabel}
Where: ${input.address}
Reference: ${input.jobReference || input.jobId}

Our team will confirm the schedule shortly. You can follow this request under My Jobs in your portal.

— VelocityMaid`;

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to: input.to,
      subject: 'Request Received — VelocityMaid',
      html,
      text,
    });
    if (error) {
      console.error('[sendHostRequestReceivedEmail] Resend error', {
        jobId: input.jobId,
        to: input.to,
        error: error.message,
      });
      return {
        sent: false,
        skippedReason: error.message,
        provider: 'RESEND',
        messageId: null,
      };
    }
    console.log('[sendHostRequestReceivedEmail] sent', {
      jobId: input.jobId,
      to: input.to,
      messageId: data?.id ?? null,
    });
    return {
      sent: true,
      provider: 'RESEND',
      messageId: data?.id ?? null,
    };
  } catch (error) {
    console.error('[sendHostRequestReceivedEmail]', {
      jobId: input.jobId,
      error,
    });
    return {
      sent: false,
      skippedReason: error instanceof Error ? error.message : 'Send failed',
      provider: 'RESEND',
      messageId: null,
    };
  }
}
