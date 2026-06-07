import { Resend } from "resend";

export const DEFAULT_RESEND_FROM = "VelocityMaid <no-reply@velocitymaid.com>";

/** Production from-address; override with RESEND_FROM_EMAIL for local testing. */
export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_RESEND_FROM;
}

function createResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/** Shared Resend client (null when RESEND_API_KEY is unset). */
export const resend = createResendClient();
