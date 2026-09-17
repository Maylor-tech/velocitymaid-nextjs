import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  tipFindMany: vi.fn(),
  jobFindMany: vi.fn(),
  jobPayoutFindMany: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tip: { findMany: (...a: unknown[]) => mocks.tipFindMany(...a) },
    job: { findMany: (...a: unknown[]) => mocks.jobFindMany(...a) },
    jobPayout: { findMany: (...a: unknown[]) => mocks.jobPayoutFindMany(...a) },
  },
}));

import { GET } from '@/app/api/cleaner/earnings/route';

describe('cleaner earnings tips isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.jobFindMany.mockResolvedValue([]);
    mocks.jobPayoutFindMany.mockResolvedValue([
      {
        id: 'po-1',
        jobId: 'job-1',
        status: 'PAID',
        cleanerAmount: 172.25,
        currency: 'USD',
        paidAt: new Date(),
        createdAt: new Date(),
      },
    ]);
  });

  it('15. includes own tip in tips list', async () => {
    mocks.requireRole.mockResolvedValue({ userId: 'cleaner-a', role: 'CLEANER' });
    mocks.tipFindMany.mockResolvedValue([
      {
        id: 'tip-1',
        jobId: 'job-1',
        amount: 2500,
        currency: 'usd',
        status: 'RECEIVED',
        receivedAt: new Date(),
        paidOutAt: null,
        createdAt: new Date(),
        internalReference: 'VM-TIP-AAAA',
      },
    ]);

    const res = await GET(new NextRequest('http://localhost/api/cleaner/earnings'));
    const json = await res.json();

    expect(json.tips.items).toHaveLength(1);
    expect(json.totals.tips).toBe(25);
    expect(json.totals.serviceEarnings).toBe(172.25);
    expect(json.totals.total).toBe(197.25);
    expect(mocks.tipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ beneficiaryCleanerId: 'cleaner-a' }),
      })
    );
  });

  it('16. query scoped to authenticated cleaner only', async () => {
    mocks.requireRole.mockResolvedValue({ userId: 'cleaner-b', role: 'CLEANER' });
    mocks.tipFindMany.mockResolvedValue([]);

    await GET(new NextRequest('http://localhost/api/cleaner/earnings'));

    expect(mocks.tipFindMany.mock.calls[0][0].where.beneficiaryCleanerId).toBe(
      'cleaner-b'
    );
  });

  it('rejects unauthenticated', async () => {
    mocks.requireRole.mockRejectedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(new NextRequest('http://localhost/api/cleaner/earnings'));
    expect(res.status).toBe(401);
  });
});
