/**
 * Stripe webhook trust boundary.
 *
 * Production (NODE_ENV=production or VERCEL_ENV=production):
 *   - STRIPE_WEBHOOK_SECRET required (fail closed if missing)
 *   - stripe-signature required
 *   - Only the Event returned by constructEvent is trusted
 *
 * Non-production without secret (local/dev convenience only):
 *   - Signature verification skipped; body is JSON.parsed
 *   - Documented intentional exception — never use in Production
 */

import type Stripe from 'stripe';

export type VerifyWebhookResult =
  | { ok: true; event: Stripe.Event; mode: 'verified' | 'dev_unsigned' }
  | { ok: false; status: number; error: string };

export function isStripeWebhookProductionEnv(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';
}

export function verifyStripeWebhookEvent(input: {
  body: string;
  signature: string | null;
  webhookSecret: string | undefined | null;
  constructEvent: (
    payload: string,
    header: string,
    secret: string
  ) => Stripe.Event;
  isProduction?: boolean;
}): VerifyWebhookResult {
  const isProduction =
    input.isProduction ?? isStripeWebhookProductionEnv();
  const secret = input.webhookSecret?.trim() || '';

  if (!secret) {
    if (isProduction) {
      return {
        ok: false,
        status: 500,
        error: 'STRIPE_WEBHOOK_SECRET is not configured',
      };
    }
    // Dev-only: accept unsigned JSON body when secret is unset.
    try {
      const event = JSON.parse(input.body) as Stripe.Event;
      if (!event?.type || !event?.data) {
        return { ok: false, status: 400, error: 'Invalid webhook event body' };
      }
      return { ok: true, event, mode: 'dev_unsigned' };
    } catch {
      return { ok: false, status: 400, error: 'Invalid webhook JSON body' };
    }
  }

  if (!input.signature) {
    return { ok: false, status: 401, error: 'Missing stripe-signature header' };
  }

  try {
    const event = input.constructEvent(input.body, input.signature, secret);
    return { ok: true, event, mode: 'verified' };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Invalid webhook signature';
    return { ok: false, status: 401, error: message };
  }
}
