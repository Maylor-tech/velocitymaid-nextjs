/**
 * Stripe Client Utility
 * 
 * Centralized Stripe initialization with lazy loading and validation
 */

import Stripe from 'stripe';

/**
 * Get Stripe client instance (lazy initialization)
 * 
 * @returns Stripe client instance
 * @throws Error if STRIPE_SECRET_KEY is not set or invalid
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  
  // Check if it's a publishable key (common mistake)
  if (secretKey.startsWith('pk_')) {
    throw new Error('You are using a PUBLISHABLE key (pk_...). Please use a SECRET key (sk_test_... or sk_live_...) instead.');
  }
  
  // Check if it's a valid secret key format
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format. Secret keys should start with sk_test_ (for testing) or sk_live_ (for production).');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
  });
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return !!secretKey && secretKey.startsWith('sk_');
}

/**
 * Export Stripe instance (for convenience)
 * Note: This will throw if Stripe is not configured
 * Use getStripe() or isStripeConfigured() for safer access
 */

