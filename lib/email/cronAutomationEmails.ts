import { resend, getResendFromEmail } from './resendClient';
import { EmailDeliveryError, sendVerifiedEmail } from './sendVerifiedEmail';
import { logIntegrationEvent } from '@/lib/google/integrationLog';

const UTC_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Calendar date in UTC. The same instant always produces the same reminder body. */
export function formatRebookingCheckoutDateUtc(date: Date): string {
  return `${UTC_MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export type SendRebookingReminderEmailResult = {
  sent: boolean;
  id?: string;
  skippedReason?: string;
  error?: string;
  outcomeUnknown?: boolean;
};

export async function sendRebookingReminderEmail(params: {
  toEmail: string;
  hostFirstName: string;
  propertyAddress: string;
  checkoutDate: Date;
  idempotencyKey: string;
}): Promise<SendRebookingReminderEmailResult> {
  const checkout = formatRebookingCheckoutDateUtc(params.checkoutDate);

  const text = `Hi ${params.hostFirstName},

Just a heads up — your guest at ${params.propertyAddress} is scheduled to check out on ${checkout}.

If you need a turnover clean, now is a great time to confirm your booking so we can have the property guest-ready.

Log in to book:
velocitymaid.com/customer/login

Or reply to this email and we'll get it scheduled.

Brian
VelocityMaid`;

  try {
    const { messageId } = await sendVerifiedEmail(
      {
        from: getResendFromEmail(),
        to: params.toEmail,
        subject: 'Guest checkout in 7 days — confirm your VelocityMaid turnover',
        text,
        html: text.replace(/\n/g, '<br>'),
      },
      params.idempotencyKey
    );
    logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_REBOOKING_REMINDER_EMAIL',
      provider: 'RESEND',
      status: 'SUCCESS',
      recipient: params.toEmail,
      templateKey: 'rebooking_reminder',
      triggeredBy: 'cron',
    }).catch(() => {});
    return { sent: true, id: messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed';
    const outcomeUnknown = err instanceof EmailDeliveryError && err.deliveryUnknown;
    logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_REBOOKING_REMINDER_EMAIL',
      provider: 'RESEND',
      status: 'FAILED',
      recipient: params.toEmail,
      templateKey: 'rebooking_reminder',
      triggeredBy: 'cron',
      errorSummary: message,
    }).catch(() => {});
    return { sent: false, error: message, outcomeUnknown };
  }
}

export async function sendLeadFollowUpEmail(params: {
  toEmail: string;
  firstName: string;
  propertyAddress: string;
}): Promise<{ sent: boolean; skippedReason?: string; error?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  }

  const text = `Hi ${params.firstName},

I wanted to follow up on your interest in VelocityMaid for ${params.propertyAddress}.

We'd love to schedule a quick walkthrough so we can learn about your property and confirm your service details before your first clean.

What day works best for you this week or next?

Brian Maylor
Founder, VelocityMaid
(802) 733-5348`;

  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: params.toEmail,
      subject: `Following up — VelocityMaid for ${params.propertyAddress}`,
      text,
      html: text.replace(/\n/g, '<br>'),
    });
    logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_LEAD_FOLLOWUP_EMAIL',
      provider: 'RESEND',
      status: 'SUCCESS',
      recipient: params.toEmail,
      templateKey: 'lead_followup',
      triggeredBy: 'cron',
    }).catch(() => {});
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed';
    logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_LEAD_FOLLOWUP_EMAIL',
      provider: 'RESEND',
      status: 'FAILED',
      recipient: params.toEmail,
      templateKey: 'lead_followup',
      triggeredBy: 'cron',
      errorSummary: message,
    }).catch(() => {});
    return { sent: false, error: message };
  }
}
