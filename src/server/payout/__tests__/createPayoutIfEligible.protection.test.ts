import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcPayout } from '@/lib/payoutRules';

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

describe('createPayoutIfEligible processing protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniquePayout.mockResolvedValue(null);
    mocks.createPayout.mockImplementation(async ({ data }: { data: { id: string } }) => data);
    mocks.createAudit.mockResolvedValue({});
  });

  it('payout uses $350 operational, not $365 customer (65% = 227.50)', async () => {
    mocks.findUniqueJob.mockResolvedValue({
      id: 'job-1',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalPrice: 365,
      quotedTotal: 365,
      operationalTotal: 350,
      branchId: 'b1',
      assignedCleanerId: 'c1',
      currency: 'USD',
    });

    const result = await createPayoutIfEligible('job-1');
    expect(result.ok).toBe(true);
    expect(mocks.createPayout).toHaveBeenCalled();
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.grossAmount).toBe(350);
    expect(data.cleanerAmount).toBe(227.5);
    expect(data.cleanerAmount).not.toBe(calcPayout(365).cleanerAmount);
  });

  it('legacy payout fallback unchanged when operationalTotal is null', async () => {
    mocks.findUniqueJob.mockResolvedValue({
      id: 'job-legacy',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalPrice: 200,
      quotedTotal: 365,
      operationalTotal: null,
      branchId: 'b1',
      assignedCleanerId: 'c1',
      currency: 'USD',
    });

    await createPayoutIfEligible('job-legacy');
    const data = mocks.createPayout.mock.calls[0][0].data;
    expect(data.grossAmount).toBe(365);
    expect(data.cleanerAmount).toBe(calcPayout(365).cleanerAmount);
  });
});
