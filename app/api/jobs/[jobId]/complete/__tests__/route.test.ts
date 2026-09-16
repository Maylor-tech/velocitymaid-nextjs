import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { JobStatus, PaymentStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  maybeCreatePayoutAfterTransition: vi.fn(),
  runJobCompletionBillingWorkflow: vi.fn(),
  sendCleanCompleteEmail: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...a: unknown[]) => mocks.findUnique(...a),
      update: (...a: unknown[]) => mocks.update(...a),
    },
  },
}));

vi.mock('@/lib/booking/maybeCreatePayoutAfterTransition', () => ({
  maybeCreatePayoutAfterTransition: (...a: unknown[]) =>
    mocks.maybeCreatePayoutAfterTransition(...a),
}));

vi.mock('@/lib/billing/jobCompletionWorkflow', () => ({
  runJobCompletionBillingWorkflow: (...a: unknown[]) =>
    mocks.runJobCompletionBillingWorkflow(...a),
}));

vi.mock('@/lib/email/sendCleanCompleteEmail', () => ({
  sendCleanCompleteEmail: (...a: unknown[]) => mocks.sendCleanCompleteEmail(...a),
}));

import { POST } from '@/app/api/jobs/[jobId]/complete/route';

function req(body: unknown) {
  return new NextRequest('http://localhost/api/jobs/job-1/complete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/jobs/[jobId]/complete (Phase 7B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    mocks.runJobCompletionBillingWorkflow.mockResolvedValue({
      report: { reportNumber: 'R-1' },
      invoice: { invoiceNumber: 'INV-1' },
      emailResults: { completionReport: { sent: true } },
    });
    mocks.maybeCreatePayoutAfterTransition.mockResolvedValue({
      ok: false,
      reason: 'NOT_FULLY_PAID',
    });
  });

  it('deposit paid + completion persists BALANCE_DUE and evaluates payout', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'job-1',
      branchId: 'b1',
      address: '1 Main',
      customerName: 'Host',
      balanceDue: null,
      marketLabel: 'vermont',
      paymentStatus: PaymentStatus.DEPOSIT_PAID,
      quotedTotal: 265,
      totalPrice: 265,
      amountPaid: 25,
      Customer: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      Branch: { state: 'VT' },
      JobPayout: null,
      photos: [],
    });
    mocks.update.mockResolvedValue({
      id: 'job-1',
      paymentStatus: PaymentStatus.BALANCE_DUE,
      balanceDue: 240,
    });

    const res = await POST(req({ completedBy: 'Admin' }), {
      params: { jobId: 'job-1' },
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: JobStatus.COMPLETED,
          paymentStatus: PaymentStatus.BALANCE_DUE,
          balanceDue: 240,
        }),
      })
    );
    expect(mocks.maybeCreatePayoutAfterTransition).toHaveBeenCalledWith('job-1');
    expect(json.paymentStatus).toBe(PaymentStatus.BALANCE_DUE);
  });

  it('full prepaid completion evaluates payout create', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'job-1',
      branchId: 'b1',
      address: '1 Main',
      customerName: 'Host',
      balanceDue: 0,
      marketLabel: 'vermont',
      paymentStatus: PaymentStatus.PAID,
      quotedTotal: 265,
      totalPrice: 265,
      amountPaid: 265,
      Customer: { firstName: 'A', lastName: 'B', email: null },
      Branch: { state: 'VT' },
      JobPayout: null,
      photos: [],
    });
    mocks.update.mockResolvedValue({
      id: 'job-1',
      paymentStatus: PaymentStatus.PAID,
      balanceDue: 0,
    });
    mocks.maybeCreatePayoutAfterTransition.mockResolvedValue({
      ok: true,
      reason: 'CREATED',
      payoutId: 'payout-1',
    });

    const res = await POST(req({ completedBy: 'Admin', sendNotification: false }), {
      params: { jobId: 'job-1' },
    });
    const json = await res.json();

    expect(mocks.update.mock.calls[0][0].data.paymentStatus).toBeUndefined();
    expect(json.payout).toEqual({
      ok: true,
      reason: 'CREATED',
      payoutId: 'payout-1',
    });
  });

  it('invoice-after-service PENDING completion does not force BALANCE_DUE', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'job-1',
      branchId: 'b1',
      address: '1 Main',
      customerName: 'Host',
      balanceDue: null,
      marketLabel: 'vermont',
      paymentStatus: PaymentStatus.PENDING,
      quotedTotal: 265,
      totalPrice: 265,
      amountPaid: null,
      Customer: null,
      Branch: { state: 'VT' },
      JobPayout: null,
      photos: [],
    });
    mocks.update.mockResolvedValue({
      id: 'job-1',
      paymentStatus: PaymentStatus.PENDING,
      balanceDue: null,
    });

    await POST(req({ completedBy: 'Admin', sendNotification: false }), {
      params: { jobId: 'job-1' },
    });

    expect(mocks.update.mock.calls[0][0].data.paymentStatus).toBeUndefined();
    expect(mocks.update.mock.calls[0][0].data.status).toBe(JobStatus.COMPLETED);
  });
});
