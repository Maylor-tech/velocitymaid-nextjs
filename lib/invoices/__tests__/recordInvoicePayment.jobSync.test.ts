import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentStatus } from '@prisma/client';

const invoiceFindUnique = vi.fn();
const invoicePaymentFindFirst = vi.fn();
const invoicePaymentCreate = vi.fn();
const invoiceUpdate = vi.fn();
const jobFindUnique = vi.fn();
const jobUpdate = vi.fn();
const expireMismatched = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: (...a: unknown[]) => invoiceFindUnique(...a),
      update: (...a: unknown[]) => invoiceUpdate(...a),
    },
    invoicePayment: {
      findFirst: (...a: unknown[]) => invoicePaymentFindFirst(...a),
      create: (...a: unknown[]) => invoicePaymentCreate(...a),
    },
    job: {
      findUnique: (...a: unknown[]) => jobFindUnique(...a),
      update: (...a: unknown[]) => jobUpdate(...a),
    },
  },
}));

vi.mock('@/lib/invoices/invoiceCheckoutSession', () => ({
  expireMismatchedInvoiceCheckoutSessions: (...a: unknown[]) => expireMismatched(...a),
  balanceToCents: (v: unknown) => Math.round(Number(v) * 100),
}));

import { recordInvoicePayment } from '@/lib/invoices/invoiceService';
import { syncJobPaymentFromInvoice } from '@/lib/invoices/syncJobPaymentFromInvoice';

function unpaidInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    jobId: 'job-1',
    status: 'SENT',
    total: 225,
    amountPaid: 0,
    balanceDue: 225,
    dueDate: new Date('2026-09-10'),
    paidAt: null,
    items: [],
    payments: [],
    ...overrides,
  };
}

describe('recordInvoicePayment + job sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invoicePaymentFindFirst.mockResolvedValue(null);
    expireMismatched.mockResolvedValue({ expired: 0 });
    invoicePaymentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'pay-1',
      ...data,
    }));
    invoiceUpdate.mockResolvedValue({});
    jobFindUnique.mockResolvedValue({
      id: 'job-1',
      paymentStatus: PaymentStatus.PENDING,
      amountPaid: 0,
      balanceDue: 225,
      paidAt: null,
      paymentMethod: null,
    });
    jobUpdate.mockResolvedValue({});
  });

  it('records Stripe payment once and syncs Job money fields to PAID', async () => {
    invoiceFindUnique
      .mockResolvedValueOnce(unpaidInvoice())
      .mockResolvedValueOnce({
        id: 'inv-1',
        jobId: 'job-1',
        amountPaid: 225,
        balanceDue: 0,
        status: 'PAID',
      });

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 225,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_test_1',
    });

    expect(result.duplicate).toBe(false);
    expect(result.becamePaid).toBe(true);
    expect(invoicePaymentCreate).toHaveBeenCalledTimes(1);
    expect(invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountPaid: 225,
          balanceDue: 0,
          status: 'PAID',
        }),
      })
    );
    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: expect.objectContaining({
          amountPaid: 225,
          balanceDue: 0,
          paymentStatus: PaymentStatus.PAID,
        }),
      })
    );
    // Service status is never touched by payment sync.
    expect(jobUpdate.mock.calls[0][0].data.status).toBeUndefined();
  });

  it('is idempotent on webhook replay via stripeSessionId', async () => {
    const existing = {
      id: 'pay-existing',
      invoiceId: 'inv-1',
      amount: 225,
      stripeSessionId: 'cs_test_1',
    };
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());
    invoicePaymentFindFirst.mockResolvedValue(existing);

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 225,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_test_1',
    });

    expect(result.duplicate).toBe(true);
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it('clamps Stripe amount when manual payment already reduced balance', async () => {
    invoiceFindUnique
      .mockResolvedValueOnce(
        unpaidInvoice({ amountPaid: 100, balanceDue: 125, status: 'PARTIALLY_PAID' })
      )
      .mockResolvedValueOnce({
        id: 'inv-1',
        jobId: 'job-1',
        amountPaid: 225,
        balanceDue: 0,
        status: 'PAID',
      });
    jobFindUnique.mockResolvedValue({
      id: 'job-1',
      paymentStatus: PaymentStatus.BALANCE_DUE,
      amountPaid: 100,
      balanceDue: 125,
      paidAt: null,
      paymentMethod: 'Zelle',
    });

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 225,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_stale_session',
    });

    expect(result.clamped).toBe(true);
    expect(invoicePaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 125 }),
      })
    );
  });

  it('rejects payment on a fully paid invoice', async () => {
    invoiceFindUnique.mockResolvedValue(
      unpaidInvoice({ amountPaid: 225, balanceDue: 0, status: 'PAID' })
    );

    await expect(
      recordInvoicePayment({
        invoiceId: 'inv-1',
        amount: 50,
        paymentMethod: 'STRIPE',
        stripeSessionId: 'cs_extra',
      })
    ).rejects.toThrow(/already paid/i);
  });

  it('syncJobPaymentFromInvoice is idempotent and does not touch Job.status', async () => {
    invoiceFindUnique.mockResolvedValue({
      id: 'inv-1',
      jobId: 'job-1',
      amountPaid: 225,
      balanceDue: 0,
      status: 'PAID',
    });
    jobFindUnique.mockResolvedValue({
      id: 'job-1',
      paymentStatus: PaymentStatus.PAID,
      amountPaid: 225,
      balanceDue: 0,
      paidAt: new Date(),
      paymentMethod: 'Stripe',
    });

    const result = await syncJobPaymentFromInvoice('inv-1');
    expect(result?.changed).toBe(false);
    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it('marks partial invoice payments as BALANCE_DUE on the job', async () => {
    invoiceFindUnique
      .mockResolvedValueOnce(unpaidInvoice())
      .mockResolvedValueOnce({
        id: 'inv-1',
        jobId: 'job-1',
        amountPaid: 100,
        balanceDue: 125,
        status: 'PARTIALLY_PAID',
      });

    await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 100,
      paymentMethod: 'ZELLE',
    });

    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountPaid: 100,
          balanceDue: 125,
          paymentStatus: PaymentStatus.BALANCE_DUE,
        }),
      })
    );
    expect(expireMismatched).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: 'inv-1',
        balanceCents: 12500,
        reason: 'SUPERSEDED',
      })
    );
  });

  it('full manual payment expires all open Checkout sessions', async () => {
    invoiceFindUnique
      .mockResolvedValueOnce(unpaidInvoice())
      .mockResolvedValueOnce({
        id: 'inv-1',
        jobId: 'job-1',
        amountPaid: 225,
        balanceDue: 0,
        status: 'PAID',
      });

    await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 225,
      paymentMethod: 'ZELLE',
    });

    expect(expireMismatched).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: 'inv-1',
        balanceCents: 0,
        reason: 'EXPIRED',
        keepStripeSessionId: null,
      })
    );
  });
});
