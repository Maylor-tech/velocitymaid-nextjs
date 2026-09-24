/**
 * Internal ops alert when a guest Stay Card submission is CONCERN or URGENT.
 * Never throws — feedback row remains authoritative if notify fails.
 * Never emails host/cleaner. Never includes raw stay / feedback tokens in logs
 * beyond the admin review URL (publicToken is in URL path of feedback admin link —
 * we use ServiceFeedback.id admin route, not public token).
 */
import { resend, getResendFromEmail } from '@/lib/email/resendClient';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import {
  createAdminNotification,
} from '@/lib/notifications/adminNotificationCenter';
import type {
  GuestFeedbackOpsClass,
  GuestIssueTopic,
} from '@/lib/feedback/guestFeedbackClassification';

const OPS_EMAIL =
  process.env.CONTACT_NOTIFICATIONS_EMAIL || 'hello@velocitymaid.com';

export const GUEST_FEEDBACK_OPS_ALERT_ACTION = 'SEND_GUEST_FEEDBACK_OPS_ALERT';

function opsAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://www.velocitymaid.com'
  );
}
export type GuestFeedbackOpsAlertInput = {
  feedbackId: string;
  jobId: string;
  jobReference: string | null;
  propertyGuestDisplayName: string;
  propertyId: string | null;
  opsClass: Exclude<GuestFeedbackOpsClass, 'NORMAL'>;
  issueTopic: GuestIssueTopic | null;
  overallRating: number;
  cleanlinessRating: number;
  comment: string | null;
  submittedAt: Date;
};

export type GuestFeedbackOpsAlertResult = {
  adminNotificationOk: boolean;
  emailSent: boolean;
  emailSkippedReason?: string;
  error?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function topicLabel(topic: GuestIssueTopic | null): string {
  if (topic === 'cleaning') return 'Cleaning issue';
  if (topic === 'attention') return 'Something needs attention';
  if (topic === 'good') return 'Everything was good';
  return 'Not specified';
}

function adminFeedbackLink(feedbackId: string): string {
  return `${opsAppBaseUrl()}/admin/feedback/${encodeURIComponent(feedbackId)}`;
}

export async function notifyGuestFeedbackOpsAlert(
  input: GuestFeedbackOpsAlertInput
): Promise<GuestFeedbackOpsAlertResult> {
  const severity = input.opsClass === 'URGENT' ? 'CRITICAL' : 'WARNING';
  const reviewUrl = adminFeedbackLink(input.feedbackId);
  const jobRef = input.jobReference || input.jobId;
  const message = [
    `Guest feedback ${input.opsClass}`,
    input.propertyGuestDisplayName,
    `job ${jobRef}`,
    `overall ${input.overallRating}/5`,
    `cleanliness ${input.cleanlinessRating}/5`,
  ].join(' · ');

  let adminNotificationOk = false;
  let emailSent = false;
  let emailSkippedReason: string | undefined;
  let error: string | undefined;

  try {
    const notif = await createAdminNotification({
      type: 'JOB_ISSUE_REPORTED',
      severity,
      message,
      jobId: input.jobId,
      actionUrl: reviewUrl,
      // Do not idempotent-skip: a job may receive HOST + GUEST feedback over time;
      // each CONCERN/URGENT guest submit should surface. Duplicate submit is
      // prevented upstream (alreadySubmitted).
    });
    adminNotificationOk = notif.ok;
    if (!notif.ok) {
      error = notif.error || 'admin_notification_failed';
      console.error('[guestFeedbackOpsAlert] admin notification failed', {
        feedbackId: input.feedbackId,
        jobId: input.jobId,
        error: notif.error,
      });
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'admin_notification_threw';
    console.error('[guestFeedbackOpsAlert] admin notification threw', {
      feedbackId: input.feedbackId,
      error,
    });
  }

  try {
    if (!resend) {
      emailSkippedReason = 'RESEND_API_KEY not configured';
    } else {
      const subject =
        input.opsClass === 'URGENT'
          ? `[URGENT] Guest Stay feedback — ${input.propertyGuestDisplayName}`
          : `[CONCERN] Guest Stay feedback — ${input.propertyGuestDisplayName}`;

      const commentBlock = input.comment
        ? `<p style="margin:16px 0;padding:12px;background:#F4F6F9;border-radius:8px;color:#0F1C2E;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(input.comment)}</p>`
        : `<p style="color:#6B7280;font-size:14px;">(No written message)</p>`;

      const html = `<!DOCTYPE html><html><body style="font-family:Helvetica,Arial,sans-serif;color:#0F1C2E;">
  <h2 style="margin:0 0 12px;">Guest Stay Card feedback — ${escapeHtml(input.opsClass)}</h2>
  <p style="margin:0 0 8px;"><strong>Property (guest-facing):</strong> ${escapeHtml(input.propertyGuestDisplayName)}</p>
  <p style="margin:0 0 8px;"><strong>Job:</strong> ${escapeHtml(jobRef)}</p>
  ${input.propertyId ? `<p style="margin:0 0 8px;"><strong>Property ID:</strong> ${escapeHtml(input.propertyId)}</p>` : ''}
  <p style="margin:0 0 8px;"><strong>Category:</strong> ${escapeHtml(input.opsClass)} · ${escapeHtml(topicLabel(input.issueTopic))}</p>
  <p style="margin:0 0 8px;"><strong>Ratings:</strong> overall ${input.overallRating}/5 · cleanliness ${input.cleanlinessRating}/5</p>
  <p style="margin:0 0 8px;"><strong>Submitted:</strong> ${escapeHtml(input.submittedAt.toISOString())}</p>
  <p style="margin:16px 0 8px;"><strong>Guest message:</strong></p>
  ${commentBlock}
  <p style="margin:24px 0;"><a href="${escapeHtml(reviewUrl)}" style="background:#00C2CB;color:#0F1C2E;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;">Review in admin</a></p>
  <p style="color:#6B7280;font-size:12px;">Internal ops only — do not forward to host or cleaner automatically. VelocityMaid Stay feedback is private.</p>
</body></html>`;

      const { error: sendError } = await resend.emails.send({
        from: getResendFromEmail(),
        to: OPS_EMAIL,
        subject,
        html,
      });

      if (sendError) {
        emailSkippedReason = sendError.message || 'resend_error';
        console.error('[guestFeedbackOpsAlert] email failed', {
          feedbackId: input.feedbackId,
          error: emailSkippedReason,
        });
        await logIntegrationEvent({
          jobId: input.jobId,
          channel: 'EMAIL',
          action: GUEST_FEEDBACK_OPS_ALERT_ACTION,
          provider: 'RESEND',
          status: 'FAILED',
          recipient: OPS_EMAIL,
          templateKey: 'guest_feedback_ops_alert',
          triggeredBy: 'system',
          errorSummary: emailSkippedReason,
        });
      } else {
        emailSent = true;
        await logIntegrationEvent({
          jobId: input.jobId,
          channel: 'EMAIL',
          action: GUEST_FEEDBACK_OPS_ALERT_ACTION,
          provider: 'RESEND',
          status: 'SUCCESS',
          recipient: OPS_EMAIL,
          templateKey: 'guest_feedback_ops_alert',
          triggeredBy: 'system',
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'email_threw';
    emailSkippedReason = msg;
    console.error('[guestFeedbackOpsAlert] email threw', {
      feedbackId: input.feedbackId,
      error: msg,
    });
    try {
      await logIntegrationEvent({
        jobId: input.jobId,
        channel: 'EMAIL',
        action: GUEST_FEEDBACK_OPS_ALERT_ACTION,
        provider: 'RESEND',
        status: 'FAILED',
        recipient: OPS_EMAIL,
        templateKey: 'guest_feedback_ops_alert',
        triggeredBy: 'system',
        errorSummary: msg,
      });
    } catch {
      /* ignore */
    }
  }

  if (!emailSent && !emailSkippedReason && !resend) {
    emailSkippedReason = 'RESEND_API_KEY not configured';
  }

  return {
    adminNotificationOk,
    emailSent,
    emailSkippedReason,
    error,
  };
}
