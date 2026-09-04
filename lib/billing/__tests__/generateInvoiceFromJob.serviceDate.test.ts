/**
 * Incident #001 C7 — admin Generate Invoice must stamp the scheduled
 * service calendar day (UTC midnight), not completedAt.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const jobFindUnique = vi.fn();
const invoiceCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    invoice: { create: (...a: unknown[]) => invoiceCreate(...a) },
    reviewRequest: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/billing/numbering', () => ({
  nextReportNumber: async () => 'CR-2026-0001',
  ensureJobReference: async (_id: string, ref: string | null) => ref ?? 'VM-2026-0001',
}));

vi.mock('@/lib/invoices/invoiceUtils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/invoices/invoiceUtils')>(
    '@/lib/invoices/invoiceUtils'
  );
  return {
    ...actual,
    nextInvoiceNumber: async (ref?: string | null) => ref ?? 'VM-2026-0001',
  };
});

vi.mock('@/lib/invoices/serializeInvoice', () => ({
  serializeInvoice: (inv: unknown) => inv,
}));

import { generateInvoiceFromJob } from '@/lib/billing/jobBillingSteps';

describe('generateInvoiceFromJob service date', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invoiceCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'inv1',
      ...data,
      items: [],
      payments: [],
    }));
  });

  it('stamps jobDate from preferredDate UTC midnight when completed the next day', async () => {
    jobFindUnique.mockResolvedValue({
      id: 'job1',
      jobReference: 'VM-2026-0001',
      customerId: 'cust1',
      customerName: 'Chris Ray Hautchamp',
      address: '198 Chipman Park, Middlebury, VT 05753',
      serviceType: 'Turnover clean',
      totalPrice: 300,
      quotedTotal: 300,
      preferredDate: new Date('2026-08-25T00:00:00.000Z'),
      completedAt: new Date('2026-08-26T16:00:34.594Z'),
      Customer: {
        id: 'cust1',
        firstName: 'Chris',
        lastName: 'Hautchamp',
        email: 'c@x.com',
        phone: null,
      },
      Invoice: null,
      CompletionReport: null,
      photos: [],
    });

    await generateInvoiceFromJob('job1');

    expect(invoiceCreate).toHaveBeenCalledTimes(1);
    const jobDate = invoiceCreate.mock.calls[0][0].data.jobDate as Date;
    expect(jobDate.toISOString()).toBe('2026-08-25T00:00:00.000Z');
  });

  it('falls back to the business calendar day of completedAt when preferredDate is missing', async () => {
    jobFindUnique.mockResolvedValue({
      id: 'job2',
      jobReference: 'VM-2026-0002',
      customerId: 'cust1',
      customerName: 'Host',
      address: 'Property',
      serviceType: 'Turnover clean',
      totalPrice: 200,
      quotedTotal: 200,
      preferredDate: null,
      completedAt: new Date('2026-08-26T16:00:34.594Z'),
      Customer: {
        id: 'cust1',
        firstName: 'Host',
        lastName: 'User',
        email: 'h@x.com',
        phone: null,
      },
      Invoice: null,
      CompletionReport: null,
      photos: [],
    });

    await generateInvoiceFromJob('job2');

    expect(invoiceCreate).toHaveBeenCalledTimes(1);
    const jobDate = invoiceCreate.mock.calls[0][0].data.jobDate as Date;
    expect(jobDate.toISOString()).toBe('2026-08-26T00:00:00.000Z');
  });
});
