import { resolveSafeWhatsAppRecipient } from '@/lib/notifications/outboundSafety';

/**
 * accepted: Meta returned 2xx and a message id. That is provider acceptance, not handset delivery.
 * failed: Meta returned a definite 4xx rejection. The message was not accepted.
 * skipped: credentials are missing, or preview/staging outbound safety blocked the recipient. No request was sent.
 * unknown: the network failed, or a response arrived without proof of rejection. The provider may have accepted it.
 * delivery_confirmed is not returned here. The status webhook only logs receipts and does not persist them.
 */
export type WhatsAppSendStatus = 'accepted' | 'failed' | 'skipped' | 'unknown';

export type WhatsAppSendResult = {
  status: WhatsAppSendStatus;
  providerMessageId?: string;
  reason?: string;
};

/**
 * Send a free-form WhatsApp text message via Meta Cloud API.
 * Preview/staging stays blocked unless the number is allowlisted.
 * Never logs credentials.
 */
export async function sendWhatsAppMessage({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    return { status: 'skipped', reason: 'whatsapp_not_configured' };
  }

  const safety = resolveSafeWhatsAppRecipient(to);
  if (!safety.allowed || !safety.to) {
    console.warn('[WHATSAPP] outbound blocked', safety.reason);
    return { status: 'skipped', reason: safety.reason };
  }

  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: safety.to.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { messages?: Array<{ id?: string }>; error?: { message?: string } }
      | null;

    const reason = payload?.error?.message || `provider_http_${response.status}`;
    if (!response.ok) {
      const definiteRejection =
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 408 &&
        response.status !== 409;
      return definiteRejection
        ? { status: 'failed', reason }
        : { status: 'unknown', reason };
    }

    const providerMessageId = payload?.messages?.[0]?.id;
    if (!providerMessageId) {
      return { status: 'unknown', reason: 'provider_missing_message_id' };
    }

    return { status: 'accepted', providerMessageId };
  } catch {
    return { status: 'unknown', reason: 'provider_unreachable' };
  }
}
