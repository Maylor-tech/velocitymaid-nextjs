import { resend, getResendFromEmail } from "./resendClient";
import { logIntegrationEvent } from "@/lib/google/integrationLog";
import {
  formatResidentialIntakeHtml,
  formatResidentialIntakeText,
} from "@/lib/residentialIntake/formatSubmission";
import type { ResidentialIntakePayload } from "@/lib/residentialIntake/types";
import {
  brandHtmlBlock,
  escapeHtml,
  NAVY,
} from "@/lib/billing/emailBrand";

const NOTIFICATION_EMAIL =
  process.env.CONTACT_NOTIFICATIONS_EMAIL || "hello@velocitymaid.com";

export async function sendResidentialIntakeConfirmationEmail(
  payload: ResidentialIntakePayload
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }

  const firstName =
    payload.fullName.trim().split(/\s+/)[0] || payload.fullName || "there";

  const html = brandHtmlBlock(
    "Request received",
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
       Hi ${escapeHtml(firstName)}, we received your residential cleaning request
       for ${escapeHtml(payload.serviceAddress)} in ${escapeHtml(payload.city)}.
     </p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NAVY};">
       Brian will review the home details, confirm scope and pricing, and follow
       up before any work is scheduled. No payment is due from this form.
     </p>
     <p style="margin:0;font-size:15px;line-height:1.6;color:${NAVY};">
       COME HOME TO CLEAN<br/>
       VelocityMaid Team
     </p>`
  );

  const text = `Hi ${firstName}, we received your residential cleaning request for ${payload.serviceAddress} in ${payload.city}.

Brian will review the home details, confirm scope and pricing, and follow up before any work is scheduled. No payment is due from this form.

COME HOME TO CLEAN
VelocityMaid Team`;

  await resend.emails.send({
    from: getResendFromEmail(),
    to: payload.email,
    subject: "Request received — VelocityMaid residential cleaning",
    html,
    text,
  });

  logIntegrationEvent({
    channel: "EMAIL",
    action: "SEND_RESIDENTIAL_INTAKE_CONFIRMATION",
    provider: "RESEND",
    status: "SUCCESS",
    recipient: payload.email,
    templateKey: "residential_intake_confirmation",
    triggeredBy: "webhook",
  }).catch(() => {});

  return { sent: true };
}

export async function sendResidentialIntakeInternalNotification(
  payload: ResidentialIntakePayload
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!resend) {
    return { sent: false, skippedReason: "RESEND_API_KEY not configured" };
  }

  await resend.emails.send({
    from: getResendFromEmail(),
    to: [NOTIFICATION_EMAIL],
    replyTo: payload.email,
    subject: `Residential intake — ${payload.city}, VT`,
    html: formatResidentialIntakeHtml(payload),
    text: formatResidentialIntakeText(payload),
  });

  logIntegrationEvent({
    channel: "EMAIL",
    action: "SEND_RESIDENTIAL_INTAKE_INTERNAL",
    provider: "RESEND",
    status: "SUCCESS",
    recipient: NOTIFICATION_EMAIL,
    templateKey: "residential_intake_internal",
    triggeredBy: "webhook",
  }).catch(() => {});

  return { sent: true };
}
