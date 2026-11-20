import { resend, getResendFromEmail } from '@/lib/email/resendClient';
import { brandHtmlBlock, escapeHtml, NAVY, MUTED } from '@/lib/billing/emailBrand';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import { WORK_AREA_LABELS, type VermontWorkApplication } from '@/lib/marketing/vermontWorkWithUs';

export const VERMONT_WORK_APPLICATION_TO = 'hello@velocitymaid.com';

export async function sendVermontWorkApplicationEmail(params: {
  application: VermontWorkApplication;
  applicationId: string;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  const app = params.application;
  const reviewUrl = `https://www.velocitymaid.com/admin/cleaners/applications/${params.applicationId}`;
  const lines = [
    ['Name', app.name],
    ['Phone', app.phone],
    ['Email', app.email],
    ['Town', app.town],
    ['Area', WORK_AREA_LABELS[app.area]],
    ['Days available', app.daysAvailable.join(', ')],
    ['Own transport', app.ownTransport === 'yes' ? 'Yes' : 'No'],
    ['Years of cleaning experience', app.yearsExperience],
    ['Short-term rental experience', app.shortTermRentalExperience === 'yes' ? 'Yes' : 'No'],
  ];
  const html = brandHtmlBlock(
    'New Vermont applicant',
    `<h1 style="margin:0 0 12px;font-size:20px;color:${NAVY};">New Vermont applicant</h1>
     ${lines
       .map(
         ([label, value]) =>
           `<p style="margin:0 0 8px;font-size:14px;color:${NAVY};"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
       )
       .join('')}
     <p style="margin:12px 0 8px;font-size:14px;color:${NAVY};"><strong>A problem they communicated:</strong></p>
     <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:${NAVY};">${escapeHtml(app.problemStory)}</p>
     <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">Open in Applicants</a>`
  );
  const text = [
    'New Vermont applicant',
    ...lines.map(([label, value]) => `${label}: ${value}`),
    '',
    'A problem they communicated:',
    app.problemStory,
    '',
    reviewUrl,
  ].join('\n');

  await resend.emails.send({
    from: getResendFromEmail(),
    to: VERMONT_WORK_APPLICATION_TO,
    replyTo: app.email,
    subject: `Vermont applicant — ${app.name}`,
    html,
    text,
  });
  logIntegrationEvent({
    channel: 'EMAIL',
    action: 'SEND_VERMONT_WORK_APPLICATION',
    provider: 'RESEND',
    status: 'SUCCESS',
    recipient: VERMONT_WORK_APPLICATION_TO,
    templateKey: 'vermont_work_with_us',
    triggeredBy: 'webhook',
  }).catch(() => {});
  return { sent: true };
}

export async function sendVermontWorkApplicationReceipt(params: {
  toEmail: string;
  name: string;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) return { sent: false, skippedReason: 'RESEND_API_KEY not configured' };
  const name = escapeHtml(params.name.trim() || 'there');
  const html = brandHtmlBlock(
    'Application received',
    `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Application received</h1>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${NAVY};">Hi ${name},</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${NAVY};">We received your application for Vermont cleaning work. We will reply by email.</p>
     <p style="margin:0;font-size:14px;color:${MUTED};">VelocityMaid</p>`
  );
  await resend.emails.send({
    from: getResendFromEmail(),
    to: params.toEmail,
    subject: 'We received your VelocityMaid application',
    html,
    text: `Hi ${params.name.trim() || 'there'},\n\nWe received your application for Vermont cleaning work. We will reply by email.\n\nVelocityMaid`,
  });
  return { sent: true };
}
