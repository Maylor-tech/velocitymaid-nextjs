import { resend, getResendFromEmail } from './resendClient';

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'there';
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function sendInvoiceOverdueReminderEmail(params: {
  toEmail: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  daysPastDue: number;
  serviceType: string;
  jobDate: Date | null;
}): Promise<{ sent: boolean; skippedReason?: string; error?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  }

  const name = firstName(params.clientName);
  const amountStr = params.amount.toFixed(2);
  const serviceDate = formatDate(params.jobDate);

  const text = `Hi ${name},

Just a friendly reminder that invoice ${params.invoiceNumber} for $${amountStr} is now ${params.daysPastDue} days past due.

Service: ${params.serviceType}
Date: ${serviceDate}
Amount due: $${amountStr}

You can pay via PayPal to hello@velocitymaid.com.

Questions? Just reply to this email.

Thank you,
Brian
VelocityMaid`;

  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: params.toEmail,
      subject: `Friendly reminder — Invoice ${params.invoiceNumber} from VelocityMaid`,
      text,
      html: text.replace(/\n/g, '<br>'),
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
  }
}

export async function sendRebookingReminderEmail(params: {
  toEmail: string;
  hostFirstName: string;
  propertyAddress: string;
  checkoutDate: Date;
}): Promise<{ sent: boolean; skippedReason?: string; error?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  }

  const checkout = formatDate(params.checkoutDate);

  const text = `Hi ${params.hostFirstName},

Just a heads up — your guest at ${params.propertyAddress} is scheduled to check out on ${checkout}.

If you need a turnover clean, now is a great time to confirm your booking so we can have the property guest-ready.

Log in to book:
velocitymaid.com/customer/login

Or reply to this email and we'll get it scheduled.

Brian
VelocityMaid`;

  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: params.toEmail,
      subject: 'Guest checkout in 7 days — confirm your VelocityMaid turnover',
      text,
      html: text.replace(/\n/g, '<br>'),
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
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
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Send failed',
    };
  }
}
