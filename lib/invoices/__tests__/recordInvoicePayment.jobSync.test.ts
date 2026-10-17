import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentStatus } from '@prisma/client';

const invoiceFindUnique = vi.fn();
const invoicePaymentFindFirst = vi.fn();
const invoicePaymentCreate = vi.fn();
const invoiceUpdate = vi.fn();
const jobFindUnique = vi.fn();
const jobUpdate = vi.fn();
const expireMismatched = vi.fn();
const queryRaw = vi.fn();
const logAuditEntry = vi.fn();

const txClient = {
  $queryRaw: (...a: unknown[]) => queryRaw(...a),
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
};

let transactionImpl: (fn: (tx: typeof txClient) => Promise<unknown>) => Promise<unknown> =
  async (fn) => fn(txClient);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (fn: (tx: typeof txClient) => Promise<unknown>) => transactionImpl(fn),
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

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
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
    transactionImpl = async (fn) => fn(txClient);
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([{ id: 'inv-1' }]);
    invoicePaymentFindFirst.mockResolvedValue(null);
    expireMismatched.mockResolvedValue({ expired: 0 });
    logAuditEntry.mockResolvedValue('audit-1');
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
    // Service status and job price are never touched by payment sync.
    expect(jobUpdate.mock.calls[0][0].data.status).toBeUndefined();
    expect(jobUpdate.mock.calls[0][0].data.totalPrice).toBeUndefined();
    expect(jobUpdate.mock.calls[0][0].data.quotedTotal).toBeUndefined();
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
      transactionReference: 'zelle-partial-1',
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
      transactionReference: 'zelle-full-1',
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

  it('retries a saved payment after job sync fails without a second payment', async () => {
    const paidInvoice = {
      id: 'inv-1',
      jobId: 'job-1',
      status: 'PAID',
      total: 225,
      amountPaid: 225,
      balanceDue: 0,
      dueDate: new Date('2026-09-10'),
      paidAt: new Date('2026-08-27T00:00:00.000Z'),
    };
    invoiceFindUnique
      .mockResolvedValueOnce(unpaidInvoice())
      .mockResolvedValueOnce(paidInvoice)
      .mockResolvedValueOnce(paidInvoice)
      .mockResolvedValueOnce(paidInvoice);
    invoicePaymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'pay-1',
        invoiceId: 'inv-1',
        amount: 225,
        stripeSessionId: 'cs_retry',
      });
    jobFindUnique
      .mockRejectedValueOnce(new Error('job row locked'))
      .mockResolvedValueOnce({
        id: 'job-1',
        status: 'COMPLETED',
        totalPrice: 300,
        quotedTotal: 300,
        paymentStatus: PaymentStatus.PENDING,
        amountPaid: 0,
        balanceDue: 300,
        paidAt: null,
        paymentMethod: null,
      });

    await expect(
      recordInvoicePayment({
        invoiceId: 'inv-1',
        amount: 225,
        paymentMethod: 'STRIPE',
        stripeSessionId: 'cs_retry',
        actorId: 'admin-user-1',
        actorRole: 'ADMIN',
      })
    ).rejects.toThrow(/job payment sync failed/);

    const recovered = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 225,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_retry',
      actorId: 'admin-user-1',
      actorRole: 'ADMIN',
    });

    expect(recovered.duplicate).toBe(true);
    expect(recovered.payment.id).toBe('pay-1');
    expect(invoicePaymentCreate).toHaveBeenCalledTimes(1);
    expect(invoiceUpdate).toHaveBeenCalledTimes(1);
    expect(invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountPaid: 225,
          balanceDue: 0,
          status: 'PAID',
        }),
      })
    );
    expect(jobUpdate).toHaveBeenCalledTimes(1);
    const jobWrite = jobUpdate.mock.calls[0][0].data as Record<string, unknown>;
    expect(jobWrite).toEqual(
      expect.objectContaining({
        amountPaid: 225,
        balanceDue: 0,
        paymentStatus: PaymentStatus.PAID,
      })
    );
    expect(jobWrite.status).toBeUndefined();
    expect(jobWrite.totalPrice).toBeUndefined();
    expect(jobWrite.quotedTotal).toBeUndefined();
    expect(logAuditEntry).toHaveBeenCalledTimes(2);
    expect(logAuditEntry.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        action: 'INVOICE_PAYMENT_RECORDED',
        actorId: 'admin-user-1',
        changes: expect.objectContaining({ syncFailed: true, jobSync: 'failed' }),
      })
    );
    expect(logAuditEntry.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        action: 'INVOICE_PAYMENT_IDEMPOTENT',
        actorId: 'admin-user-1',
        changes: expect.objectContaining({
          duplicate: true,
          jobSync: 'repaired',
          paymentId: 'pay-1',
          amountPaid: 225,
          balanceDue: 0,
        }),
      })
    );
    expect(logAuditEntry.mock.calls[1][0].changes.syncFailed).toBeUndefined();
  });

  it('does not let a concurrent sync overwrite job fields with a stale total', async () => {
    let invoicePaid = 100;
    let tail: Promise<void> = Promise.resolve();
    transactionImpl = async (fn) => {
      const previous = tail;
      let release: () => void = () => undefined;
      tail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        return await fn(txClient);
      } finally {
        release();
      }
    };
    invoiceFindUnique.mockImplementation(async () => ({
      id: 'inv-1',
      jobId: 'job-1',
      amountPaid: invoicePaid,
      balanceDue: 225 - invoicePaid,
      status: invoicePaid >= 225 ? 'PAID' : 'PARTIALLY_PAID',
    }));
    jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      totalPrice: 300,
      quotedTotal: 300,
      paymentStatus: PaymentStatus.PENDING,
      amountPaid: 0,
      balanceDue: 225,
      paidAt: null,
      paymentMethod: null,
    });
    const writes: number[] = [];
    jobUpdate.mockImplementation(async ({ data }: { data: { amountPaid: number } }) => {
      writes.push(data.amountPaid);
      invoicePaid = 225;
    });

    await Promise.all([
      syncJobPaymentFromInvoice('inv-1'),
      syncJobPaymentFromInvoice('inv-1'),
    ]);

    expect(writes).toEqual([100, 225]);
    const lockSql = queryRaw.mock.calls.map((call) =>
      (call[0] as TemplateStringsArray).join(' ')
    );
    expect(lockSql.some((sql) => /Invoice/.test(sql) && /FOR UPDATE/.test(sql))).toBe(true);
    expect(lockSql.some((sql) => /Job/.test(sql) && /FOR UPDATE/.test(sql))).toBe(true);
    for (const call of jobUpdate.mock.calls) {
      const data = call[0].data as Record<string, unknown>;
      expect(data.status).toBeUndefined();
      expect(data.totalPrice).toBeUndefined();
      expect(data.quotedTotal).toBeUndefined();
    }
  });
});
