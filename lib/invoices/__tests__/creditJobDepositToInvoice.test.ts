import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const invoiceFindUnique = vi.fn();
const invoiceUpdate = vi.fn();
const invoicePaymentFindFirst = vi.fn();
const invoicePaymentCreate = vi.fn();
const jobFindUnique = vi.fn();
const jobUpdate = vi.fn();
const queryRaw = vi.fn();
const logAuditEntry = vi.fn();
const finalizeInvoicePayment = vi.fn();
const retrievePi = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: (...a: unknown[]) => invoiceFindUnique(...a),
    },
    job: {
      findUnique: (...a: unknown[]) => jobFindUnique(...a),
    },
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
        job: {
          findUnique: (...a: unknown[]) => jobFindUnique(...a),
          update: (...a: unknown[]) => jobUpdate(...a),
        },
      }),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
}));

vi.mock('@/lib/invoices/invoiceService', () => ({
  finalizeInvoicePayment: (...a: unknown[]) => finalizeInvoicePayment(...a),
  recordInvoicePayment: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    paymentIntents: {
      retrieve: (...a: unknown[]) => retrievePi(...a),
    },
  }),
}));

import { creditJobDepositToInvoice } from '../creditJobDepositToInvoice';
import { ELIZABETH_K_PHASE2 } from '@/lib/billing/elizabethKPhase2';

const PI = ELIZABETH_K_PHASE2.paymentIntentId;
const CUSTOMER_ID = ELIZABETH_K_PHASE2.customerId;

function capturedPi(overrides: Record<string, unknown> = {}) {
  return {
    id: PI,
    status: 'succeeded',
    amount: 2500,
    amount_received: 2500,
    currency: 'usd',
    metadata: { jobId: ELIZABETH_K_PHASE2.jobId, customerId: CUSTOMER_ID },
    ...overrides,
  };
}

function draftInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: ELIZABETH_K_PHASE2.invoiceId,
    jobId: ELIZABETH_K_PHASE2.jobId,
    customerId: CUSTOMER_ID,
    status: 'DRAFT',
    total: 250,
    amountPaid: 0,
    balanceDue: 250,
    payments: [],
    ...overrides,
  };
}

function jobRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ELIZABETH_K_PHASE2.jobId,
    customerId: CUSTOMER_ID,
    currency: 'USD',
    quotedTotal: 425,
    amountPaid: 25,
    depositAmount: 25,
    depositPaymentIntentId: PI,
    paymentStatus: 'BALANCE_DUE',
    ...overrides,
  };
}

describe('creditJobDepositToInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
      const sql = strings.join(' ');
      if (sql.includes('pg_indexes')) {
        return [{ indexname: 'invoice_payment_intent_once' }];
      }
      return [{ id: ELIZABETH_K_PHASE2.invoiceId }];
    });
    invoicePaymentFindFirst.mockResolvedValue(null);
    logAuditEntry.mockResolvedValue('audit-1');
    retrievePi.mockResolvedValue(capturedPi());
    invoicePaymentCreate.mockResolvedValue({
      id: 'pay-credit-1',
      transactionReference: PI,
      amount: 25,
    });
    invoiceUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...draftInvoice(),
      ...data,
    }));
    jobFindUnique.mockResolvedValue(jobRow());
    jobUpdate.mockResolvedValue({});
    invoiceFindUnique.mockResolvedValue(draftInvoice());
  });

  it('credits the existing PI once and keeps the invoice DRAFT at $250 / $25 / $225', async () => {
    const result = await creditJobDepositToInvoice({
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      confirmJobId: ELIZABETH_K_PHASE2.jobId,
      paymentIntentId: PI,
      amount: 25,
    });

    expect(result.duplicate).toBe(false);
    expect(result.invoiceStatus).toBe('DRAFT');
    expect(result.total).toBe(250);
    expect(result.amountPaid).toBe(25);
    expect(result.balanceDue).toBe(225);
    expect(result.quotedTotalPreserved).toBe(425);
    expect(result.emailed).toBe(false);
    expect(result.charged).toBe(false);
    expect(retrievePi).toHaveBeenCalledWith(PI);
    expect(invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountPaid: 25,
          balanceDue: 225,
          status: 'DRAFT',
        }),
      })
    );
    expect(jobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountPaid: 25,
          balanceDue: 225,
          paymentStatus: 'BALANCE_DUE',
        }),
      })
    );
    const jobData = jobUpdate.mock.calls[0][0].data as Record<string, unknown>;
    expect(jobData).not.toHaveProperty('quotedTotal');
    expect(jobData).not.toHaveProperty('depositPaymentIntentId');
    expect(finalizeInvoicePayment).not.toHaveBeenCalled();
  });

  it('is idempotent on a duplicate PaymentIntent', async () => {
    const existing = {
      id: 'pay-existing',
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      transactionReference: PI,
      amount: 25,
    };
    invoicePaymentFindFirst.mockResolvedValue(existing);
    invoiceFindUnique.mockResolvedValue(
      draftInvoice({ amountPaid: 25, balanceDue: 225, payments: [existing] })
    );

    const first = await creditJobDepositToInvoice({
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      confirmJobId: ELIZABETH_K_PHASE2.jobId,
      paymentIntentId: PI,
      amount: 25,
    });
    const second = await creditJobDepositToInvoice({
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      confirmJobId: ELIZABETH_K_PHASE2.jobId,
      paymentIntentId: PI,
      amount: 25,
    });

    expect(first.duplicate).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(first.paymentId).toBe('pay-existing');
    expect(second.paymentId).toBe(first.paymentId);
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
  });

  it('treats a concurrent unique-constraint retry as a duplicate', async () => {
    invoicePaymentFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'pay-raced',
        invoiceId: ELIZABETH_K_PHASE2.invoiceId,
        transactionReference: PI,
      });
    invoicePaymentCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    const result = await creditJobDepositToInvoice({
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      confirmJobId: ELIZABETH_K_PHASE2.jobId,
      paymentIntentId: PI,
      amount: 25,
    });

    expect(result.duplicate).toBe(true);
    expect(result.paymentId).toBe('pay-raced');
    expect(result.invoiceStatus).toBe('DRAFT');
    expect(invoiceUpdate).not.toHaveBeenCalled();
  });

  it('does not send a customer payment email', async () => {
    await creditJobDepositToInvoice({
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      confirmJobId: ELIZABETH_K_PHASE2.jobId,
      paymentIntentId: PI,
      amount: 25,
    });
    expect(finalizeInvoicePayment).not.toHaveBeenCalled();
    expect(logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({ emailed: false, charged: false }),
      })
    );
  });

  it('refuses to credit a SENT invoice', async () => {
    invoiceFindUnique.mockResolvedValue(draftInvoice({ status: 'SENT' }));
    await expect(
      creditJobDepositToInvoice({
        invoiceId: ELIZABETH_K_PHASE2.invoiceId,
        confirmJobId: ELIZABETH_K_PHASE2.jobId,
        paymentIntentId: PI,
        amount: 25,
      })
    ).rejects.toMatchObject({ code: 'INVOICE_NOT_DRAFT' });
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
  });

  it('refuses an uncaptured or mismatched PaymentIntent', async () => {
    retrievePi.mockResolvedValue(capturedPi({ status: 'requires_capture' }));
    await expect(
      creditJobDepositToInvoice({
        invoiceId: ELIZABETH_K_PHASE2.invoiceId,
        confirmJobId: ELIZABETH_K_PHASE2.jobId,
        paymentIntentId: PI,
        amount: 25,
      })
    ).rejects.toMatchObject({ code: 'PAYMENT_INTENT_NOT_CAPTURED' });
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
  });

  it('blocks a new credit write when the unique index is not applied', async () => {
    queryRaw.mockImplementation(async (strings: TemplateStringsArray) => {
      const sql = strings.join(' ');
      if (sql.includes('pg_indexes')) return [];
      return [{ id: ELIZABETH_K_PHASE2.invoiceId }];
    });

    await expect(
      creditJobDepositToInvoice({
        invoiceId: ELIZABETH_K_PHASE2.invoiceId,
        confirmJobId: ELIZABETH_K_PHASE2.jobId,
        paymentIntentId: PI,
        amount: 25,
      })
    ).rejects.toMatchObject({ code: 'MIGRATION_REQUIRED', status: 503 });
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
    expect(invoiceUpdate).not.toHaveBeenCalled();
    expect(jobUpdate).not.toHaveBeenCalled();
  });

  it('still returns an existing credit without requiring the unique index', async () => {
    const existing = {
      id: 'pay-existing',
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      transactionReference: PI,
      amount: 25,
    };
    invoicePaymentFindFirst.mockResolvedValue(existing);
    invoiceFindUnique.mockResolvedValue(
      draftInvoice({ amountPaid: 25, balanceDue: 225, payments: [existing] })
    );
    queryRaw.mockImplementation(async () => [{ id: ELIZABETH_K_PHASE2.invoiceId }]);

    const result = await creditJobDepositToInvoice({
      invoiceId: ELIZABETH_K_PHASE2.invoiceId,
      confirmJobId: ELIZABETH_K_PHASE2.jobId,
      paymentIntentId: PI,
      amount: 25,
    });

    expect(result.duplicate).toBe(true);
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
  });

  it('refuses a customer mismatch between invoice and job', async () => {
    jobFindUnique.mockResolvedValue(jobRow({ customerId: 'other-customer' }));
    await expect(
      creditJobDepositToInvoice({
        invoiceId: ELIZABETH_K_PHASE2.invoiceId,
        confirmJobId: ELIZABETH_K_PHASE2.jobId,
        paymentIntentId: PI,
        amount: 25,
      })
    ).rejects.toMatchObject({ code: 'CUSTOMER_MISMATCH' });
    expect(invoicePaymentCreate).not.toHaveBeenCalled();
  });
});
