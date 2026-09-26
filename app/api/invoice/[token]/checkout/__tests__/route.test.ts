import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const createOrReuseInvoiceCheckout = vi.fn();

vi.mock('@/lib/invoices/invoiceCheckoutSession', () => ({
  createOrReuseInvoiceCheckout: (...a: unknown[]) => createOrReuseInvoiceCheckout(...a),
}));

import { POST } from '@/app/api/invoice/[token]/checkout/route';

describe('POST /api/invoice/[token]/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates checkout with server-controlled balance for unpaid invoices', async () => {
    createOrReuseInvoiceCheckout.mockResolvedValue({
      ok: true,
      url: 'https://checkout.stripe.com/test',
      reused: false,
      sessionId: 'cs_1',
      amountCents: 22500,
      invoice: { id: 'inv-1', balanceDue: 225 },
    });
    const res = await POST(
      new NextRequest('http://localhost/api/invoice/tok-1/checkout', { method: 'POST' }),
      { params: { token: 'tok-1' } }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.url).toContain('checkout.stripe.com');
    expect(createOrReuseInvoiceCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ publicToken: 'tok-1' })
    );
  });

  it('rejects checkout when invoice is already PAID', async () => {
    createOrReuseInvoiceCheckout.mockResolvedValue({
      ok: false,
      error: 'This invoice is already paid',
      status: 400,
    });
    const res = await POST(
      new NextRequest('http://localhost/api/invoice/tok-1/checkout', { method: 'POST' }),
      { params: { token: 'tok-1' } }
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/already paid/i);
  });

  it('rejects checkout when balance is zero', async () => {
    createOrReuseInvoiceCheckout.mockResolvedValue({
      ok: false,
      error: 'Nothing due on this invoice',
      status: 400,
    });
    const res = await POST(
      new NextRequest('http://localhost/api/invoice/tok-1/checkout', { method: 'POST' }),
      { params: { token: 'tok-1' } }
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/nothing due/i);
  });
});
