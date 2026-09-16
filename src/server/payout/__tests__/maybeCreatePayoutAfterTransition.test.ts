import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobStatus, PaymentStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  findUniqueJob: vi.fn(),
  findUniquePayout: vi.fn(),
  createPayout: vi.fn(),
  createAudit: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => mocks.findUniqueJob(...a) },
    jobPayout: {
      findUnique: (...a: unknown[]) => mocks.findUniquePayout(...a),
      create: (...a: unknown[]) => mocks.createPayout(...a),
    },
    auditLog: { create: (...a: unknown[]) => mocks.createAudit(...a) },
  },
}));

import { createPayoutIfEligible } from '@/src/server/payout/createPayoutIfEligible';
import { maybeCreatePayoutAfterTransition } from '@/lib/booking/maybeCreatePayoutAfterTransition';

function baseJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    status: JobStatus.COMPLETED,
    paymentStatus: PaymentStatus.PAID,
    totalPrice: 265,
    quotedTotal: 265,
    operationalTotal: null,
    branchId: 'b1',
    assignedCleanerId: 'cleaner-1',
    currency: 'USD',
    ...overrides,
  };
}

describe('COMPLETED + PAID payout orchestration (Phase 7B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniquePayout.mockResolvedValue(null);
    mocks.createPayout.mockImplementation(async ({ data }: { data: { id: string } }) => data);
    mocks.createAudit.mockResolvedValue({});
  });

  it('full-prepaid completed job -> one JobPayout created', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob());
    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result).toEqual({ ok: true, reason: 'CREATED', payoutId: expect.any(String) });
    expect(mocks.createPayout).toHaveBeenCalledTimes(1);
  });

  it('repeated evaluation -> no duplicate payout', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob());
    mocks.findUniquePayout
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'payout-existing' });

    const first = await createPayoutIfEligible('job-1');
    const second = await createPayoutIfEligible('job-1');

    expect(first.ok && first.reason === 'CREATED').toBe(true);
    expect(second).toEqual({
      ok: true,
      reason: 'ALREADY_EXISTS',
      payoutId: 'payout-existing',
    });
    expect(mocks.createPayout).toHaveBeenCalledTimes(1);
  });

  it('unpaid completed job -> no payout', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ paymentStatus: PaymentStatus.BALANCE_DUE })
    );
    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result).toEqual({ ok: false, reason: 'NOT_FULLY_PAID' });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('unassigned completed+paid job -> no payout', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob({ assignedCleanerId: null }));
    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result).toEqual({ ok: false, reason: 'NO_CLEANER' });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('existing JobPayout -> idempotent', async () => {
    mocks.findUniqueJob.mockResolvedValue(baseJob());
    mocks.findUniquePayout.mockResolvedValue({ id: 'payout-1' });
    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result).toEqual({
      ok: true,
      reason: 'ALREADY_EXISTS',
      payoutId: 'payout-1',
    });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });

  it('incomplete + paid -> no payout yet', async () => {
    mocks.findUniqueJob.mockResolvedValue(
      baseJob({ status: JobStatus.IN_PROGRESS })
    );
    const result = await maybeCreatePayoutAfterTransition('job-1');
    expect(result).toEqual({ ok: false, reason: 'NOT_COMPLETED' });
    expect(mocks.createPayout).not.toHaveBeenCalled();
  });
});
