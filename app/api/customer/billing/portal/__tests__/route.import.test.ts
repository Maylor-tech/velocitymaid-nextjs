/**
 * Importing the billing portal route must not require STRIPE_SECRET_KEY.
 * Next.js collects page data at build time; a top-level Stripe init would fail CI.
 */
import { describe, expect, it } from 'vitest';

describe('POST /api/customer/billing/portal module import', () => {
  it('does not throw when STRIPE_SECRET_KEY is missing', async () => {
    const previous = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    try {
      const mod = await import('@/app/api/customer/billing/portal/route');
      expect(typeof mod.POST).toBe('function');
    } finally {
      if (previous === undefined) {
        delete process.env.STRIPE_SECRET_KEY;
      } else {
        process.env.STRIPE_SECRET_KEY = previous;
      }
    }
  });
});
