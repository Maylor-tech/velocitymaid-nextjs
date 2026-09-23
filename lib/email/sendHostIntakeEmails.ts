import { resend, getResendFromEmail } from "./resendClient";
import { logIntegrationEvent } from "@/lib/google/integrationLog";
import { HOST_WELCOME_PACKET_URL } from "@/lib/hostIntake/constants";
import {
  formatHostIntakeHtml,
  formatHostIntakeText,
} from "@/lib/hostIntake/formatSubmission";
import type { HostIntakePayload, HostSetupRequestPayload } from "@/lib/hostIntake/types";
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
       Brian will follow up to confirm your quote, first service, and client portal login.
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

  const text = `Hi ${firstName}, we've received your host intake form for ${payload.propertyAddress}. Brian will follow up to confirm your quote, first service, and client portal login.

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

export async function sendHostSetupRequestConfirmationEmail(
  payload: HostSetupRequestPayload
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }

  const firstName =
    payload.fullName.trim().split(/\s+/)[0] || payload.fullName || "there";

  const html = brandHtml(
    "Property setup request received",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
       Hi ${escapeHtml(firstName)}, thanks — your property setup request is in.
       Brian will follow up about your Vermont property in ${escapeHtml(payload.city)}.
     </p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
       When you are ready, you can complete your full property details so we can
       prepare your service profile.
     </p>
     <p style="margin:0;font-size:15px;line-height:1.6;color:${NAVY};">
       COME HOME TO CLEAN<br/>
       VelocityMaid Team
     </p>`
  );

  const text = `Hi ${firstName}, thanks — your property setup request is in. Brian will follow up about your Vermont property in ${payload.city}.

When you are ready, you can complete your full property details so we can prepare your service profile.

COME HOME TO CLEAN
VelocityMaid Team`;

  await resend.emails.send({
    from: getResendFromEmail(),
    to: payload.email,
    subject: "Thanks — your VelocityMaid property setup request is in",
    html,
    text,
  });

  logIntegrationEvent({
    channel: "EMAIL",
    action: "SEND_HOST_SETUP_REQUEST_CONFIRMATION",
    provider: "RESEND",
    status: "SUCCESS",
    recipient: payload.email,
    templateKey: "host_setup_request_confirmation",
    triggeredBy: "webhook",
  }).catch(() => {});

  return { sent: true };
}

export async function sendHostSetupRequestInternalNotification(
  payload: HostSetupRequestPayload
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }

  const attr = payload.attribution;
  const attrLines = attr
    ? [
        `landing: ${attr.landing || "—"}`,
        `utm_source: ${attr.utm_source || "—"}`,
        `utm_medium: ${attr.utm_medium || "—"}`,
        `utm_campaign: ${attr.utm_campaign || "—"}`,
        `utm_content: ${attr.utm_content || "—"}`,
      ].join("\n")
    : "—";

  const text = `NEW HOST SETUP REQUEST (/hosts)
=======================
Name: ${payload.fullName}
Email: ${payload.email}
Phone: ${payload.phone || "—"}
Vermont town: ${payload.city}
Interest: ${payload.serviceInterest || "—"}

Attribution:
${attrLines}`;

  const html = `
<h2>New Host Setup Request — /hosts</h2>
<ul>
  <li><strong>Name:</strong> ${escapeHtml(payload.fullName)}</li>
  <li><strong>Email:</strong> ${escapeHtml(payload.email)}</li>
  <li><strong>Phone:</strong> ${escapeHtml(payload.phone || "—")}</li>
  <li><strong>Vermont town:</strong> ${escapeHtml(payload.city)}</li>
  <li><strong>Interest:</strong> ${escapeHtml(payload.serviceInterest || "—")}</li>
</ul>
<pre style="font-size:12px;background:#f5f5f5;padding:12px;border-radius:8px;">${escapeHtml(attrLines)}</pre>
`.trim();

  await resend.emails.send({
    from: getResendFromEmail(),
    to: [NOTIFICATION_EMAIL],
    replyTo: payload.email,
    subject: `Host Setup Request — ${payload.city}, VT`,
    html,
    text,
  });

  logIntegrationEvent({
    channel: "EMAIL",
    action: "SEND_HOST_SETUP_REQUEST_INTERNAL",
    provider: "RESEND",
    status: "SUCCESS",
    recipient: NOTIFICATION_EMAIL,
    templateKey: "host_setup_request_internal",
    triggeredBy: "webhook",
  }).catch(() => {});

  return { sent: true };
}
