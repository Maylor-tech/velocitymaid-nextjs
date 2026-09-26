import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvoiceCheckoutSessionStatus } from '@prisma/client';

const invoiceFindUnique = vi.fn();
const sessionFindMany = vi.fn();
const sessionFindUnique = vi.fn();
const sessionCreate = vi.fn();
const sessionUpdate = vi.fn();
const stripeRetrieve = vi.fn();
const stripeExpire = vi.fn();
const stripeCreate = vi.fn();
const createAdminNotification = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: { findUnique: (...a: unknown[]) => invoiceFindUnique(...a) },
    invoiceCheckoutSession: {
      findMany: (...a: unknown[]) => sessionFindMany(...a),
      findUnique: (...a: unknown[]) => sessionFindUnique(...a),
      create: (...a: unknown[]) => sessionCreate(...a),
      update: (...a: unknown[]) => sessionUpdate(...a),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: (...a: unknown[]) => stripeRetrieve(...a),
        expire: (...a: unknown[]) => stripeExpire(...a),
        create: (...a: unknown[]) => stripeCreate(...a),
      },
    },
  }),
}));

vi.mock('@/lib/invoices/serializeInvoice', () => ({
  serializeInvoice: (invoice: unknown) => invoice,
}));

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: (...a: unknown[]) => createAdminNotification(...a),
}));

import {
  createOrReuseInvoiceCheckout,
  expireMismatchedInvoiceCheckoutSessions,
  markInvoiceCheckoutNeedsReconciliation,
  markInvoiceCheckoutSessionCompleted,
} from '@/lib/invoices/invoiceCheckoutSession';

function unpaidInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    invoiceNumber: 'VM-2026-0099',
    publicToken: 'tok-1',
    status: 'SENT',
    balanceDue: 225,
    serviceType: 'Turnover',
    clientEmail: 'a@b.com',
    jobId: 'job-1',
    items: [],
    payments: [],
    ...overrides,
  };
}

describe('invoiceCheckoutSession lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    sessionFindMany.mockResolvedValue([]);
    sessionCreate.mockResolvedValue({ id: 'row-1' });
    sessionUpdate.mockResolvedValue({});
    stripeExpire.mockResolvedValue({});
    stripeCreate.mockResolvedValue({
      id: 'cs_new',
      url: 'https://checkout.stripe.com/new',
    });
    createAdminNotification.mockResolvedValue({ ok: true, created: true, id: 'n1' });
  });

  it('rejects PAID invoices', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice({ status: 'PAID', balanceDue: 0 }));
    const result = await createOrReuseInvoiceCheckout({
      publicToken: 'tok-1',
      origin: 'https://velocitymaid.com',
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error).toMatch(/already paid/i);
      expect(result.status).toBe(400);
    }
    expect(stripeCreate).not.toHaveBeenCalled();
  });

  it('reuses one active session when amount is unchanged', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());
    sessionFindMany.mockResolvedValue([
      {
        id: 'row-open',
        invoiceId: 'inv-1',
        stripeSessionId: 'cs_open',
        amountCents: 22500,
        status: InvoiceCheckoutSessionStatus.OPEN,
      },
    ]);
    stripeRetrieve.mockResolvedValue({
      status: 'open',
      url: 'https://checkout.stripe.com/open',
    });

    const result = await createOrReuseInvoiceCheckout({
      publicToken: 'tok-1',
      origin: 'https://velocitymaid.com',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reused).toBe(true);
      expect(result.url).toContain('checkout.stripe.com/open');
      expect(result.amountCents).toBe(22500);
    }
    expect(stripeCreate).not.toHaveBeenCalled();
  });

  it('expires mismatched open session and creates replacement for new balance', async () => {
    invoiceFindUnique
      .mockResolvedValueOnce(unpaidInvoice({ balanceDue: 125 }))
      .mockResolvedValueOnce(unpaidInvoice({ balanceDue: 125 }));
    sessionFindMany
      .mockResolvedValueOnce([
        {
          id: 'row-old',
          invoiceId: 'inv-1',
          stripeSessionId: 'cs_old_225',
          amountCents: 22500,
          status: InvoiceCheckoutSessionStatus.OPEN,
        },
      ])
      // expireMismatched with balanceCents 0 lists all open
      .mockResolvedValueOnce([
        {
          id: 'row-old',
          invoiceId: 'inv-1',
          stripeSessionId: 'cs_old_225',
          amountCents: 22500,
          status: InvoiceCheckoutSessionStatus.OPEN,
        },
      ]);
    stripeRetrieve.mockResolvedValue({ status: 'open' });

    const result = await createOrReuseInvoiceCheckout({
      publicToken: 'tok-1',
      origin: 'https://velocitymaid.com',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reused).toBe(false);
      expect(result.amountCents).toBe(12500);
    }
    expect(stripeExpire).toHaveBeenCalledWith('cs_old_225');
    expect(sessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: InvoiceCheckoutSessionStatus.SUPERSEDED,
        }),
      })
    );
    expect(stripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 12500 }),
          }),
        ],
      })
    );
    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripeSessionId: 'cs_new',
          amountCents: 12500,
          status: InvoiceCheckoutSessionStatus.OPEN,
        }),
      })
    );
  });

  it('full balance zero expires all open sessions', async () => {
    sessionFindMany.mockResolvedValue([
      {
        id: 'row-a',
        invoiceId: 'inv-1',
        stripeSessionId: 'cs_a',
        amountCents: 22500,
        status: InvoiceCheckoutSessionStatus.OPEN,
      },
    ]);
    stripeRetrieve.mockResolvedValue({ status: 'open' });

    const { expired } = await expireMismatchedInvoiceCheckoutSessions({
      invoiceId: 'inv-1',
      balanceCents: 0,
      reason: 'EXPIRED',
    });

    expect(expired).toBe(1);
    expect(stripeExpire).toHaveBeenCalledWith('cs_a');
    expect(sessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: InvoiceCheckoutSessionStatus.EXPIRED,
        }),
      })
    );
  });

  it('marks completed session without creating reconciliation', async () => {
    sessionFindUnique.mockResolvedValue({
      id: 'row-1',
      status: InvoiceCheckoutSessionStatus.OPEN,
      completedAt: null,
    });
    await markInvoiceCheckoutSessionCompleted('cs_done');
    expect(sessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: InvoiceCheckoutSessionStatus.COMPLETED,
        }),
      })
    );
  });

  it('flags real excess Stripe capture for reconciliation (not silent discard)', async () => {
    sessionFindUnique.mockResolvedValue({
      id: 'row-1',
      status: InvoiceCheckoutSessionStatus.OPEN,
      completedAt: null,
    });
    invoiceFindUnique.mockResolvedValue({
      invoiceNumber: 'VM-2026-0099',
      jobId: 'job-1',
    });

    await markInvoiceCheckoutNeedsReconciliation({
      invoiceId: 'inv-1',
      stripeSessionId: 'cs_excess',
      capturedAmountCents: 22500,
      note: 'already paid',
      jobId: 'job-1',
    });

    expect(sessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: InvoiceCheckoutSessionStatus.NEEDS_RECONCILIATION,
          capturedAmountCents: 22500,
          reconciliationNote: 'already paid',
        }),
      })
    );
    expect(createAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'INVOICE_STRIPE_OVERPAYMENT',
        severity: 'CRITICAL',
      })
    );
  });
});
