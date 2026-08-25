/**
 * Incident #001 — completion-no-auto-send.
 * Job completion must create a DRAFT invoice and must NOT auto-send it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const jobFindUnique = vi.fn();
const completionReportUpsert = vi.fn();
const completionReportUpdate = vi.fn();
const invoiceCreate = vi.fn();
const loadJobTeamMembers = vi.fn();
const sendCompletionReportEmail = vi.fn();
const createAdminNotification = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    completionReport: {
      upsert: (...a: unknown[]) => completionReportUpsert(...a),
      update: (...a: unknown[]) => completionReportUpdate(...a),
    },
    invoice: { create: (...a: unknown[]) => invoiceCreate(...a) },
  },
}));

vi.mock('@/lib/cleaners/internalCleanerService', () => ({
  loadJobTeamMembers: (...a: unknown[]) => loadJobTeamMembers(...a),
}));

vi.mock('@/lib/billing/numbering', () => ({
  nextReportNumber: async () => 'CR-2026-0001',
  nextReceiptNumber: async () => 'RC-2026-0001',
  ensureJobReference: async (_id: string, ref: string | null) => ref ?? 'VM-2026-0001',
}));

vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: (...a: unknown[]) => {
    createAdminNotification(...a);
    return Promise.resolve();
  },
  adminNotificationHelpers: { adminJobLink: (id: string) => `/admin/jobs/${id}` },
}));

vi.mock('@/lib/billing/serializeCompletionReport', () => ({
  serializeCompletionReport: (r: unknown) => r,
}));

vi.mock('@/lib/billing/serializeReceipt', () => ({
  serializeReceipt: (r: unknown) => r,
}));

vi.mock('@/lib/billing/billingEmails', () => ({
  sendCompletionReportEmail: (...a: unknown[]) => sendCompletionReportEmail(...a),
  sendReceiptDocumentEmail: vi.fn(),
  sendReviewRequestAfterPayment: vi.fn(),
}));

vi.mock('@/lib/invoices/serializeInvoice', () => ({
  serializeInvoice: (inv: unknown) => inv,
}));

import { runJobCompletionBillingWorkflow } from '@/lib/billing/jobCompletionWorkflow';

beforeEach(() => {
  vi.clearAllMocks();
  loadJobTeamMembers.mockResolvedValue([]);
  sendCompletionReportEmail.mockResolvedValue({ sent: true });
  completionReportUpsert.mockResolvedValue({ id: 'cr1', reportNumber: 'CR-2026-0001' });
  completionReportUpdate.mockResolvedValue({});
  jobFindUnique.mockResolvedValue({
    id: 'job1',
    jobReference: 'VM-2026-0001',
    customerId: 'cust1',
    customerName: 'Chris Ray Hautchamp',
    address: '198 Chipman Park, Middlebury, VT 05753',
    serviceType: 'Turnover clean',
    totalPrice: 300,
    quotedTotal: 300,
    amountPaid: 0,
    photos: [],
    Customer: { id: 'cust1', firstName: 'Chris', lastName: 'Hautchamp', email: 'c@x.com', phone: null },
    Invoice: null,
    CompletionReport: null,
  });
  // Return whatever status was requested at create time.
  invoiceCreate.mockImplementation(async ({ data }: { data: { status: string; sentAt: Date | null } }) => ({
    id: 'inv1',
    status: data.status,
    sentAt: data.sentAt,
    balanceDue: 300,
    items: [],
    payments: [],
  }));
});

describe('runJobCompletionBillingWorkflow', () => {
  it('creates a DRAFT invoice and does not auto-send it', async () => {
    const result = await runJobCompletionBillingWorkflow({
      jobId: 'job1',
      completedAt: new Date('2026-08-23T15:00:00.000Z'),
      completedBy: 'Cleaner A',
      sendEmails: true,
    });

    // Invoice created as DRAFT, never SENT, sentAt null.
    expect(invoiceCreate).toHaveBeenCalledTimes(1);
    const createArg = invoiceCreate.mock.calls[0][0];
    expect(createArg.data.status).toBe('DRAFT');
    expect(createArg.data.sentAt).toBeNull();

    // Completion report email still sent; invoice send deferred (not dispatched).
    expect(sendCompletionReportEmail).toHaveBeenCalledTimes(1);
    expect(result.invoiceSendDeferred).toBe(true);
    expect(result.emailResults.invoice?.sent).toBe(false);
  });
});
