import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import {
  verifyStripeWebhookEvent,
  isStripeWebhookProductionEnv,
} from '@/lib/stripe/verifyWebhookEvent';

const sampleEvent = {
  id: 'evt_1',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_1' } },
} as unknown as Stripe.Event;

describe('verifyStripeWebhookEvent (Phase 7B trust boundary)', () => {
  it('valid signed event accepted — returns constructEvent object', () => {
    const constructEvent = vi.fn(() => sampleEvent);
    const result = verifyStripeWebhookEvent({
      body: '{"tampered":true}',
      signature: 't=1,v1=abc',
      webhookSecret: 'whsec_test',
      constructEvent,
      isProduction: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe('verified');
      expect(result.event).toBe(sampleEvent);
      expect(result.event).not.toEqual({ tampered: true });
    }
    expect(constructEvent).toHaveBeenCalledWith(
      '{"tampered":true}',
      't=1,v1=abc',
      'whsec_test'
    );
  });

  it('invalid signature rejected', () => {
    const result = verifyStripeWebhookEvent({
      body: '{}',
      signature: 'bad',
      webhookSecret: 'whsec_test',
      constructEvent: () => {
        throw new Error('No signatures found matching the expected signature for payload');
      },
      isProduction: true,
    });
    expect(result).toEqual({
      ok: false,
      status: 401,
      error: 'No signatures found matching the expected signature for payload',
    });
  });

  it('missing secret in production fails closed', () => {
    const result = verifyStripeWebhookEvent({
      body: JSON.stringify(sampleEvent),
      signature: 't=1,v1=abc',
      webhookSecret: '',
      constructEvent: vi.fn(),
      isProduction: true,
    });
    expect(result).toEqual({
      ok: false,
      status: 500,
      error: 'STRIPE_WEBHOOK_SECRET is not configured',
    });
  });

  it('missing secret in non-production allows documented unsigned parse', () => {
    const result = verifyStripeWebhookEvent({
      body: JSON.stringify(sampleEvent),
      signature: null,
      webhookSecret: null,
      constructEvent: vi.fn(),
      isProduction: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe('dev_unsigned');
      expect(result.event.type).toBe('checkout.session.completed');
    }
  });

  it('missing signature with secret configured is rejected', () => {
    const result = verifyStripeWebhookEvent({
      body: '{}',
      signature: null,
      webhookSecret: 'whsec_test',
      constructEvent: vi.fn(),
      isProduction: false,
    });
    expect(result).toEqual({
      ok: false,
      status: 401,
      error: 'Missing stripe-signature header',
    });
  });

  it('isStripeWebhookProductionEnv detects VERCEL_ENV=production', () => {
    expect(
      isStripeWebhookProductionEnv({
        VERCEL_ENV: 'production',
      } as unknown as NodeJS.ProcessEnv)
    ).toBe(true);
    expect(
      isStripeWebhookProductionEnv({
        NODE_ENV: 'development',
      } as unknown as NodeJS.ProcessEnv)
    ).toBe(false);
  });
});
