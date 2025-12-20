/**
 * Stripe Client Utility
 * 
 * Centralized Stripe initialization
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});

export default stripe;

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




