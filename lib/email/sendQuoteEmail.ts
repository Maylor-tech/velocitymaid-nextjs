import { resend, getResendFromEmail } from "./resendClient";
import { logIntegrationEvent } from "@/lib/google/integrationLog";

export interface SendQuoteEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendQuoteEmailResult {
  sent: boolean;
  id?: string;
  skippedReason?: string;
  error?: string;
}

export async function sendQuoteEmail(
  params: SendQuoteEmailParams
): Promise<SendQuoteEmailResult> {
  if (!resend) {
    return {
      sent: false,
      skippedReason: "RESEND_API_KEY is not configured",
    };
  }

  const to = params.to.trim();
  if (!to) {
    return { sent: false, error: "Recipient email is required" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });

    if (error) {
      logIntegrationEvent({
        channel: 'EMAIL',
        action: 'SEND_QUOTE_EMAIL',
        provider: 'RESEND',
        status: 'FAILED',
        recipient: to,
        templateKey: 'quote_email',
        triggeredBy: 'system',
        errorSummary: error.message,
      }).catch(() => {});
      return { sent: false, error: error.message || "Failed to send email" };
    }

    logIntegrationEvent({
      channel: 'EMAIL',
      action: 'SEND_QUOTE_EMAIL',
      provider: 'RESEND',
      status: 'SUCCESS',
      recipient: to,
      templateKey: 'quote_email',
      triggeredBy: 'system',
    }).catch(() => {});

    return { sent: true, id: data?.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to send quote email";
    return { sent: false, error: message };
  }
}
