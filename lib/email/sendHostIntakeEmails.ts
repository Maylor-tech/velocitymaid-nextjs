import { resend, getResendFromEmail } from "./resendClient";
import { logIntegrationEvent } from "@/lib/google/integrationLog";
import { HOST_WELCOME_PACKET_URL } from "@/lib/hostIntake/constants";
import {
  formatHostIntakeHtml,
  formatHostIntakeText,
} from "@/lib/hostIntake/formatSubmission";
import type { HostIntakePayload } from "@/lib/hostIntake/types";
import {
  brandHtmlBlock,
  escapeHtml,
  NAVY,
  CYAN,
} from "@/lib/billing/emailBrand";

const NOTIFICATION_EMAIL =
  process.env.CONTACT_NOTIFICATIONS_EMAIL || "hello@velocitymaid.com";

function brandHtml(title: string, body: string): string {
  return brandHtmlBlock(title, body);
}

export async function sendHostIntakeConfirmationEmail(
  payload: HostIntakePayload
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }

  const firstName =
    payload.fullName.trim().split(/\s+/)[0] || payload.fullName || "there";
  const address = escapeHtml(payload.propertyAddress);
  const packetUrl = escapeHtml(HOST_WELCOME_PACKET_URL);

  const html = brandHtml(
    "Welcome to VelocityMaid",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
       Hi ${escapeHtml(firstName)}, we've received your host intake form for ${address}.
       Brian will be in touch within 24 hours to confirm your first service and send your client portal login.
     </p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
       In the meantime, here's everything you need to know about working with VelocityMaid:
     </p>
     <p style="margin:0 0 20px;">
       <a href="${packetUrl}" style="display:inline-block;background:${CYAN};color:${NAVY};font-weight:700;text-decoration:none;padding:12px 20px;border-radius:8px;">
         Host Welcome Packet
       </a>
     </p>
     <p style="margin:0;font-size:15px;line-height:1.6;color:${NAVY};">
       COME HOME TO CLEAN<br/>
       VelocityMaid Team
     </p>`
  );

  const text = `Hi ${firstName}, we've received your host intake form for ${payload.propertyAddress}. Brian will be in touch within 24 hours to confirm your first service and send your client portal login.

In the meantime, here's everything you need to know about working with VelocityMaid:
Host Welcome Packet: ${HOST_WELCOME_PACKET_URL}

COME HOME TO CLEAN
VelocityMaid Team`;

  await resend.emails.send({
    from: getResendFromEmail(),
    to: payload.email,
    subject: "Welcome to VelocityMaid — your host profile has been received",
    html,
    text,
  });

  logIntegrationEvent({
    channel: 'EMAIL',
    action: 'SEND_HOST_INTAKE_CONFIRMATION',
    provider: 'RESEND',
    status: 'SUCCESS',
    recipient: payload.email,
    templateKey: 'host_intake_confirmation',
    triggeredBy: 'webhook',
  }).catch(() => {});

  return { sent: true };
}

export async function sendHostIntakeInternalNotification(
  payload: HostIntakePayload
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }

  const subject = `New Host Intake — ${payload.propertyAddress}`;

  await resend.emails.send({
    from: getResendFromEmail(),
    to: [NOTIFICATION_EMAIL],
    replyTo: payload.email,
    subject,
    html: formatHostIntakeHtml(payload),
    text: formatHostIntakeText(payload),
  });

  logIntegrationEvent({
    channel: 'EMAIL',
    action: 'SEND_HOST_INTAKE_INTERNAL_NOTIFICATION',
    provider: 'RESEND',
    status: 'SUCCESS',
    recipient: NOTIFICATION_EMAIL,
    templateKey: 'host_intake_internal_notification',
    triggeredBy: 'webhook',
  }).catch(() => {});

  return { sent: true };
}
