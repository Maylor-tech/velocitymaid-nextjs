import { Resend } from "resend";
import { filterOutboundEmailTo } from "@/lib/notifications/outboundSafety";

export const DEFAULT_RESEND_FROM = "VelocityMaid <no-reply@velocitymaid.com>";

/** Production from-address; override with RESEND_FROM_EMAIL for local testing. */
export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_RESEND_FROM;
}

function guardResendClient(client: Resend): Resend {
  const originalSend = client.emails.send.bind(client.emails);
  client.emails.send = ((payload: { to: string | string[] }, options?: unknown) => {
    const filtered = filterOutboundEmailTo(payload.to);
    if (!filtered.allowed || !filtered.to) {
      console.warn("[email] outbound blocked", filtered.reason);
      return Promise.resolve({
        data: null,
        error: {
          name: "application_error",
          message: `outbound_blocked:${filtered.reason}`,
          statusCode: 0,
        },
      });
    }
    return originalSend({ ...payload, to: filtered.to } as Parameters<typeof originalSend>[0], options as never);
  }) as typeof client.emails.send;
  return client;
}

function createResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return guardResendClient(new Resend(process.env.RESEND_API_KEY));
}

/** Shared Resend client (null when RESEND_API_KEY is unset). Preview/staging send is filtered. */
export const resend = createResendClient();

/** Guarded client for callers that previously constructed `new Resend()`. */
export function getGuardedResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return createResendClient();
}
