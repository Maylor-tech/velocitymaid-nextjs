import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  schedule: vi.fn(),
  sendAfterPayment: vi.fn(),
  loadCtx: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reviewRequest: {
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
    serviceFeedback: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock('@/lib/billing/jobCompletionWorkflow', () => ({
  scheduleReviewRequestForJob: (...a: unknown[]) => mocks.schedule(...a),
  onInvoicePaymentRecorded: vi.fn(),
}));

vi.mock('@/lib/billing/billingEmails', () => ({
  sendCompletionReportEmail: vi.fn(),
  sendReviewRequestAfterPayment: (...a: unknown[]) => mocks.sendAfterPayment(...a),
}));

vi.mock('@/lib/feedback/serviceFeedback', async () => {
  const actual = await vi.importActual<typeof import('@/lib/feedback/serviceFeedback')>(
    '@/lib/feedback/serviceFeedback'
  );
  return {
    ...actual,
    getFeedbackWorkflowState: vi.fn().mockResolvedValue({
      state: 'pending',
      requestedAt: null,
      submittedAt: null,
      reminderSentAt: null,
      status: null,
      overallRating: null,
      feedbackId: null,
      publicToken: null,
    }),
    requestServiceFeedbackForJob: vi.fn(),
  };
});

vi.mock('@/lib/feedback/sendServiceFeedbackEmail', () => ({
  sendServiceFeedbackRequestEmail: vi.fn(),
}));

vi.mock('@/lib/cleaners/internalCleanerService', () => ({
  loadJobTeamMembers: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/invoices/invoiceUtils', () => ({
  nextInvoiceNumber: vi.fn(),
  decimalToNumber: (n: unknown) => Number(n),
  formatUsd: (n: number) => `$${n}`,
}));
vi.mock('@/lib/billing/commercialAmount', () => ({
  requireCommercialAmount: vi.fn(),
}));
vi.mock('@/lib/invoices/serializeInvoice', () => ({ serializeInvoice: vi.fn() }));
vi.mock('@/lib/email/invoiceEmails', () => ({ sendInvoiceSentEmail: vi.fn() }));
vi.mock('@/lib/invoices/invoiceService', () => ({ recordInvoicePayment: vi.fn() }));
vi.mock('@/lib/invoices/validateInvoiceSendable', () => ({
  validateInvoiceSendable: vi.fn(),
}));
vi.mock('@/lib/audit', () => ({ logAuditEntry: vi.fn() }));
vi.mock('@/lib/billing/serializeCompletionReport', () => ({
  serializeCompletionReport: vi.fn(),
}));
vi.mock('@/lib/billing/numbering', () => ({
  nextReportNumber: vi.fn(),
  ensureJobReference: vi.fn(),
}));
vi.mock('@/lib/dates/serviceDate', () => ({ invoiceServiceDateFromJob: vi.fn() }));

// Patch loadJobBillingContext by mocking prisma.job used inside it
vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...args: unknown[]) => mocks.loadCtx(...args),
    },
    reviewRequest: {
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
    serviceFeedback: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

describe('sendReviewRequestForJob sentAt contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadCtx.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      address: '111 Thomson',
      serviceLocation: 'Ludlow',
      customerName: 'Tiffany',
      Customer: { email: 't@example.com', firstName: 'Tiffany', lastName: 'M' },
      Invoice: null,
      Branch: { slug: 'vermont' },
      photos: [],
      CompletionReport: null,
    });
    mocks.findFirst.mockResolvedValue(null);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.schedule.mockResolvedValue(undefined);
  });

  it('does not re-send when sentAt already present', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'rr-1', sentAt: new Date() });
    const { sendReviewRequestForJob } = await import('@/lib/billing/jobBillingSteps');
    const result = await sendReviewRequestForJob('job-1');
    expect(result.alreadySent).toBe(true);
    expect(mocks.sendAfterPayment).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it('stamps sentAt only after successful email', async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.sendAfterPayment.mockResolvedValue({ sent: true });
    const { sendReviewRequestForJob } = await import('@/lib/billing/jobBillingSteps');
    const result = await sendReviewRequestForJob('job-1');
    expect(result.email.sent).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-1', sentAt: null },
      data: { sentAt: expect.any(Date) },
    });
  });

  it('does not stamp sentAt when email fails', async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.sendAfterPayment.mockResolvedValue({ sent: false, error: 'boom' });
    const { sendReviewRequestForJob } = await import('@/lib/billing/jobBillingSteps');
    const result = await sendReviewRequestForJob('job-1');
    expect(result.email.sent).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
