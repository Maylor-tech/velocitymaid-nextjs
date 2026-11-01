import type { Resend } from 'resend';
import { resend } from './resendClient';

export class EmailDeliveryError extends Error {
  constructor(message: string, public readonly deliveryUnknown: boolean) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

/** A resolved SDK call is not necessarily an accepted email. */
export async function sendVerifiedEmail(
  payload: Parameters<Resend['emails']['send']>[0],
  idempotencyKey?: string
): Promise<{ messageId: string }> {
  if (!resend) throw new EmailDeliveryError('Email provider not configured', false);
  let result: Awaited<ReturnType<Resend['emails']['send']>>;
  try {
    result = await resend.emails.send(payload, idempotencyKey ? { idempotencyKey } : undefined);
  } catch {
    // A timeout may occur after acceptance. Do not assume a retry is safe.
    throw new EmailDeliveryError('Email delivery outcome requires reconciliation', true);
  }
  if (result.error) {
    const status = result.error.statusCode;
    const blockedLocally = result.error.message.startsWith('outbound_blocked:');
    const unknown = !blockedLocally && (!status || status >= 500 || status === 408 || status === 409);
    throw new EmailDeliveryError(result.error.message, unknown);
  }
  if (!result.data?.id) throw new EmailDeliveryError('Email provider returned no message ID', true);
  return { messageId: result.data.id };
}
