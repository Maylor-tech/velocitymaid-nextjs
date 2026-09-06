/**
 * Stripe Client Utility
 *
 * Lazy initialization — do not construct Stripe at module import time.
 * Next.js collects page data for API routes during `next build`; a top-level
 * secret check would fail CI that does not set STRIPE_SECRET_KEY.
 */

import Stripe from 'stripe';

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

/**
 * Environment Variables Required:
 *
 * STRIPE_SECRET_KEY - Stripe secret key
 * STRIPE_WEBHOOK_SECRET - Webhook secret (for webhook verification)
 * STRIPE_PRICE_WEEKLY - Price ID for weekly subscription
 * STRIPE_PRICE_BIWEEKLY - Price ID for bi-weekly subscription
 * STRIPE_PRICE_MONTHLY - Price ID for monthly subscription
 * STRIPE_BILLING_PORTAL_RETURN_URL - Return URL for billing portal (e.g., https://velocitymaid.com/customer/billing)
 */
