/**
 * Send a free-form WhatsApp text message via Meta Cloud API.
 * Silently skips if env is not configured; never throws.
 */
export async function sendWhatsAppMessage({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''), // E.164: digits only (no +)
        type: 'text',
        text: {
          body: message,
        },
      }),
    });
  } catch (err) {
    console.error('[WHATSAPP] Failed to send message:', err);
  }
}
