import { beforeEach, describe, expect, it, vi } from 'vitest';

const jobFindUnique = vi.fn();
const invoiceUpdate = vi.fn();
const invoiceItemCreate = vi.fn();
const invoiceItemUpdate = vi.fn();
const invoicePaymentCreate = vi.fn();
const transaction = vi.fn();
const auditCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    $transaction: (...a: unknown[]) => transaction(...a),
    auditLog: { create: (...a: unknown[]) => auditCreate(...a) },
  },
}));

vi.mock('@/lib/invoices/serializeInvoice', () => ({
  serializeInvoice: (inv: { id: string; invoiceNumber?: string; total?: number }) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    total: inv.total,
  }),
}));

import { syncZeroInvoiceFromJobPrice } from '../syncZeroInvoiceFromJob';

function paidJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bf40fbe9-ba3b-4515-a47d-c78ceaa46e46',
    totalPrice: 265,
    quotedTotal: 265,
    amountPaid: 265,
    paymentStatus: 'PAID',
    paidAt: new Date('2026-09-10T16:00:00.000Z'),
    depositPaidAt: new Date('2026-09-10T16:00:00.000Z'),
    balancePaidAt: null,
    depositPaymentIntentId: 'pi_3U8jotRqPKxN0h8W0mg1Bwzk',
    balancePaymentIntentId: null,
    serviceType: 'Vacation Rental Turnover',
    Invoice: {
      id: 'inv-34',
      invoiceNumber: 'VM-2026-0034',
      total: 0,
      subtotal: 0,
      amountPaid: 0,
      balanceDue: 0,
      status: 'PAID',
      paidAt: null,
      notes: 'Generated from job',
      items: [
        {
          id: 'item-1',
          description: 'Vacation Rental Turnover',
          lineTotal: 0,
        },
      ],
      payments: [],
    },
    ...overrides,
  };
}

describe('syncZeroInvoiceFromJobPrice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        invoiceItem: { create: invoiceItemCreate, update: invoiceItemUpdate },
        invoicePayment: { create: invoicePaymentCreate },
        invoice: {
          update: invoiceUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'inv-34',
            invoiceNumber: 'VM-2026-0034',
            ...data,
            items: [{ id: 'item-1', description: 'Vacation Rental Turnover', lineTotal: 265 }],
            payments: [{ id: 'pay-1', amount: 265 }],
          })),
        },
      };
      return fn(tx);
    });
    auditCreate.mockResolvedValue({ id: 'aud-1' });
  });

  it('repairs a $0 invoice from the job commercial amount and backfills Stripe payment', async () => {
    jobFindUnique.mockResolvedValue(paidJob());

    const result = await syncZeroInvoiceFromJobPrice('bf40fbe9-ba3b-4515-a47d-c78ceaa46e46');

    expect(result.synced).toBe(true);
    if (!result.synced) return;
    expect(result.previousTotal).toBe(0);
    expect(result.nextTotal).toBe(265);
    expect(invoiceItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ unitPrice: 265, lineTotal: 265 }),
      })
    );
    expect(invoicePaymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 265,
          paymentMethod: 'STRIPE',
          transactionReference: 'pi_3U8jotRqPKxN0h8W0mg1Bwzk',
        }),
      })
    );
    expect(invoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: 265,
          amountPaid: 265,
          balanceDue: 0,
          status: 'PAID',
        }),
      })
    );
  });

  it('leaves a priced invoice alone', async () => {
    jobFindUnique.mockResolvedValue(
      paidJob({
        Invoice: {
          id: 'inv-34',
          invoiceNumber: 'VM-2026-0034',
          total: 265,
          amountPaid: 265,
          balanceDue: 0,
          status: 'PAID',
          paidAt: new Date(),
          notes: null,
          items: [],
          payments: [],
        },
      })
    );

    const result = await syncZeroInvoiceFromJobPrice('job-1');
    expect(result).toMatchObject({ synced: false, reason: 'INVOICE_ALREADY_PRICED' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('does not invent a price when the job has none', async () => {
    jobFindUnique.mockResolvedValue(
      paidJob({
        totalPrice: null,
        quotedTotal: null,
        amountPaid: 0,
      })
    );

    const result = await syncZeroInvoiceFromJobPrice('job-1');
    expect(result).toMatchObject({ synced: false, reason: 'NO_COMMERCIAL_AMOUNT' });
    expect(transaction).not.toHaveBeenCalled();
  });
});
