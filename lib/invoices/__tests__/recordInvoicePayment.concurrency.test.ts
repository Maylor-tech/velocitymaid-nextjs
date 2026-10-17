import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const invoiceFindUnique = vi.fn();
const invoiceUpdate = vi.fn();
const invoicePaymentFindFirst = vi.fn();
const invoicePaymentCreate = vi.fn();
const queryRaw = vi.fn();
const logAuditEntry = vi.fn();
const expireMismatched = vi.fn();
const syncJob = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        $queryRaw: (...a: unknown[]) => queryRaw(...a),
        invoice: {
          findUnique: (...a: unknown[]) => invoiceFindUnique(...a),
          update: (...a: unknown[]) => invoiceUpdate(...a),
        },
        invoicePayment: {
          findFirst: (...a: unknown[]) => invoicePaymentFindFirst(...a),
          create: (...a: unknown[]) => invoicePaymentCreate(...a),
        },
      }),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
}));

vi.mock('@/lib/invoices/invoiceCheckoutSession', () => ({
  expireMismatchedInvoiceCheckoutSessions: (...a: unknown[]) => expireMismatched(...a),
  balanceToCents: (v: unknown) => Math.round(Number(v) * 100),
}));

vi.mock('@/lib/invoices/syncJobPaymentFromInvoice', () => ({
  syncJobPaymentFromInvoice: (...a: unknown[]) => syncJob(...a),
}));

import { recordInvoicePayment } from '../invoiceService';

function unpaidInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    jobId: 'job-1',
    status: 'SENT',
    total: 200,
    amountPaid: 0,
    balanceDue: 200,
    dueDate: new Date('2099-09-10'),
    paidAt: null,
    ...overrides,
  };
}

describe('recordInvoicePayment concurrency & idempotency (FIN-001)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockResolvedValue([{ id: 'inv-1' }]);
    invoicePaymentFindFirst.mockResolvedValue(null);
    logAuditEntry.mockResolvedValue('audit-1');
    expireMismatched.mockResolvedValue({ expired: 0 });
    syncJob.mockResolvedValue(undefined);
    invoicePaymentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'pay-1',
      ...data,
    }));
    invoiceUpdate.mockResolvedValue({});
  });

  it('records a partial payment and marks PARTIALLY_PAID', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 50,
      paymentMethod: 'CASH',
    });

    expect(result.duplicate).toBe(false);
    expect(result.clamped).toBe(false);
    expect(Number(result.payment.amount)).toBe(50);
    expect(invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountPaid: 50,
          balanceDue: 150,
          status: 'PARTIALLY_PAID',
        }),
      })
    );
    expect(syncJob).toHaveBeenCalledWith('inv-1');
    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVOICE_PAYMENT_RECORDED' })
    );
  });

  it('returns duplicate for the same stripeSessionId without double-crediting', async () => {
    const existing = {
      id: 'pay-existing',
      invoiceId: 'inv-1',
      amount: 200,
      stripeSessionId: 'cs_test_1',
    };
    invoiceFindUnique.mockResolvedValue(unpaidInvoice({ amountPaid: 200, balanceDue: 0, status: 'PAID' }));
    invoicePaymentFindFirst.mockResolvedValue(existing);

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 200,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_test_1',
    });

    expect(result.duplicate).toBe(true);
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
    expect(syncJob).not.toHaveBeenCalled();
    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVOICE_PAYMENT_IDEMPOTENT' })
    );
  });

  it('returns duplicate for the same transactionReference', async () => {
    const existing = {
      id: 'pay-ref',
      invoiceId: 'inv-1',
      amount: 75,
      transactionReference: 'ZELLE-ABC-123',
    };
    invoiceFindUnique.mockResolvedValue(
      unpaidInvoice({ amountPaid: 75, balanceDue: 125, status: 'PARTIALLY_PAID' })
    );
    invoicePaymentFindFirst.mockResolvedValue(existing);

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 75,
      paymentMethod: 'ZELLE',
      transactionReference: 'ZELLE-ABC-123',
    });

    expect(result.duplicate).toBe(true);
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
  });

  it('handles P2002 race as duplicate without updating amountPaid', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());
    invoicePaymentCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );
    invoicePaymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'pay-raced',
        invoiceId: 'inv-1',
        amount: 200,
        stripeSessionId: 'cs_race',
      });

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 200,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_race',
    });

    expect(result.duplicate).toBe(true);
    expect(result.payment.id).toBe('pay-raced');
    expect(invoiceUpdate).not.toHaveBeenCalled();
  });

  it('requires transactionReference for Zelle', async () => {
    await expect(
      recordInvoicePayment({
        invoiceId: 'inv-1',
        amount: 40,
        paymentMethod: 'ZELLE',
      })
    ).rejects.toThrow(/transactionReference is required/);
  });

  it('records external Zelle payment with reference once', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 40,
      paymentMethod: 'ZELLE',
      transactionReference: 'zelle-memo-9',
    });

    expect(result.duplicate).toBe(false);
    expect(invoicePaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentMethod: 'ZELLE',
          transactionReference: 'zelle-memo-9',
          amount: 40,
        }),
      })
    );
  });

  it('clamps overpayment and audits INVOICE_PAYMENT_CLAMPED', async () => {
    invoiceFindUnique.mockResolvedValue(
      unpaidInvoice({ amountPaid: 150, balanceDue: 50, status: 'PARTIALLY_PAID' })
    );

    const result = await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 100,
      paymentMethod: 'CASH',
    });

    expect(result.clamped).toBe(true);
    expect(Number(result.payment.amount)).toBe(50);
    expect(result.remainingBefore).toBe(50);
    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVOICE_PAYMENT_CLAMPED' })
    );
  });

  it('locks the invoice row with FOR UPDATE before mutating', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());

    await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 10,
      paymentMethod: 'CASH',
    });

    expect(queryRaw).toHaveBeenCalled();
    const sqlParts = queryRaw.mock.calls[0][0] as TemplateStringsArray;
    expect(sqlParts.join(' ')).toMatch(/FOR UPDATE/);
  });

  it('attributes a real admin user on the audit row', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());

    await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 25,
      paymentMethod: 'CASH',
      actorId: 'admin-user-1',
      actorRole: 'ADMIN',
    });

    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin-user-1',
        actorRole: 'ADMIN',
        action: 'INVOICE_PAYMENT_RECORDED',
      })
    );
  });

  it('keeps the legacy local-admin sentinel off the User foreign key', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());

    await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 25,
      paymentMethod: 'CASH',
      actorId: 'local-admin',
      actorRole: 'ADMIN',
    });

    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        actorRole: 'ADMIN',
        changes: expect.objectContaining({ unresolvedActorId: 'local-admin' }),
      })
    );
  });

  it('attributes a Stripe webhook with no actor as SYSTEM', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());

    await recordInvoicePayment({
      invoiceId: 'inv-1',
      amount: 25,
      paymentMethod: 'STRIPE',
      stripeSessionId: 'cs_system_1',
    });

    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        actorRole: 'SYSTEM',
      })
    );
  });

  it('writes the audit row when job payment sync fails, then rejects', async () => {
    invoiceFindUnique.mockResolvedValue(unpaidInvoice());
    syncJob.mockRejectedValueOnce(new Error('job row locked'));

    await expect(
      recordInvoicePayment({
        invoiceId: 'inv-1',
        amount: 25,
        paymentMethod: 'CASH',
        actorId: 'admin-user-1',
        actorRole: 'ADMIN',
      })
    ).rejects.toThrow(/job payment sync failed/);

    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin-user-1',
        actorRole: 'ADMIN',
        changes: expect.objectContaining({ syncFailed: true }),
      })
    );
  });
});
