import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const cookieGet = vi.fn();
const findCustomerById = vi.fn();
const getOrCreateStripeCustomerForCustomer = vi.fn();
const getStripe = vi.fn();
const billingPortalCreate = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => cookieGet(name) }),
}));

vi.mock('@/utils/customerData', () => ({
  findCustomerById: (...a: unknown[]) => findCustomerById(...a),
}));

vi.mock('@/utils/getOrCreateStripeCustomerForCustomer', () => ({
  getOrCreateStripeCustomerForCustomer: (...a: unknown[]) =>
    getOrCreateStripeCustomerForCustomer(...a),
}));

vi.mock('@/utils/stripe', () => ({
  getStripe: (...a: unknown[]) => getStripe(...a),
}));

import { POST } from '@/app/api/customer/billing/portal/route';

const CUSTOMER = {
  id: 'cust-1',
  firstName: 'Ada',
  lastName: 'Host',
  email: 'ada@example.com',
  phone: '+15555550100',
  stripeCustomerId: 'cus_123',
};

function portalRequest() {
  return new NextRequest('http://localhost/api/customer/billing/portal', {
    method: 'POST',
  });
}

describe('POST /api/customer/billing/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue(undefined);
    findCustomerById.mockReset();
    getOrCreateStripeCustomerForCustomer.mockReset();
    getStripe.mockReset();
    billingPortalCreate.mockReset();
    getStripe.mockReturnValue({
      billingPortal: { sessions: { create: billingPortalCreate } },
    });
  });

  it('returns 401 when the customer session cookie is missing', async () => {
    const res = await POST(portalRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Not authenticated/i);
    expect(getStripe).not.toHaveBeenCalled();
    expect(getOrCreateStripeCustomerForCustomer).not.toHaveBeenCalled();
  });

  it('fails safely when STRIPE_SECRET_KEY is missing after auth', async () => {
    cookieGet.mockImplementation((name: string) =>
      name === 'customerId' ? { value: 'cust-1' } : undefined
    );
    findCustomerById.mockReturnValue(CUSTOMER);
    getOrCreateStripeCustomerForCustomer.mockResolvedValue('cus_123');
    getStripe.mockImplementation(() => {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    });

    const res = await POST(portalRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/STRIPE_SECRET_KEY/);
  });

  it('creates a billing portal session when Stripe is configured', async () => {
    cookieGet.mockImplementation((name: string) =>
      name === 'customerId' ? { value: 'cust-1' } : undefined
    );
    findCustomerById.mockReturnValue(CUSTOMER);
    getOrCreateStripeCustomerForCustomer.mockResolvedValue('cus_123');
    billingPortalCreate.mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    });

    const res = await POST(portalRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.url).toBe('https://billing.stripe.com/session/test');
    expect(getStripe).toHaveBeenCalledTimes(1);
    expect(billingPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_123',
        return_url: expect.stringContaining('/customer/billing'),
      })
    );
  });
});
