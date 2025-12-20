// lib/email/resendClient.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  // Don't crash the app, just log. API route will also validate.
  console.warn('RESEND_API_KEY is not set. Estimate emails will fail.');
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? '');







