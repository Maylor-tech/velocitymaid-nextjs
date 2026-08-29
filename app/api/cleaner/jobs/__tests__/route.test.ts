import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const findMany = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findMany: (...args: unknown[]) => findMany(...args) },
  },
}));

vi.mock('@/lib/api/routeAuth', () => ({
  rethrowIfAuthResponse: (error: unknown) =>
    error instanceof NextResponse ? error : null,
}));

import { GET } from '@/app/api/cleaner/jobs/route';

const CLEANER_ID = 'cleaner-brian';

describe('GET /api/cleaner/jobs compensation visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ userId: CLEANER_ID, role: 'CLEANER' });
  });

  it('returns offer compensation and omits customer financials', async () => {
    findMany.mockResolvedValue([
      {
        id: 'job-1',
        status: 'ASSIGNED',
        customerName: 'Tiffany Mayo',
        serviceType: 'Vacation Rental Turnover',
        serviceLocation: 'Ludlow',
        preferredDate: new Date('2026-09-15T00:00:00.000Z'),
        preferredTime: '11:00 AM',
        address: '111 Thomson Drive',
        currency: 'USD',
        assignedAt: new Date(),
        startedAt: null,
        completedAt: null,
        submittedForQcAt: null,
        estimatedDurationMins: 180,
        Branch: { id: 'branch-vt', name: 'Vermont' },
        JobOffer: [
          {
            compensationAmount: 195,
            compensationCurrency: 'USD',
            compensationBasis: 'FLAT',
          },
        ],
      },
    ]);

    const res = await GET(new NextRequest('http://localhost/api/cleaner/jobs'));
    expect(res.status).toBe(200);
    const json = await res.json();
    const job = json.jobs[0];
    expect(job.compensation.amount).toBe(195);
    expect(job.compensation.basis).toBe('FLAT');
    expect(job.compensationAmount).toBe(195);
    expect(job.quotedTotal).toBeUndefined();
    expect(job.totalPrice).toBeUndefined();
    expect(job.operationalTotal).toBeUndefined();
    expect(job.paymentStatus).toBeUndefined();
    expect(JSON.stringify(json)).not.toMatch(
      /quotedTotal|totalPrice|operationalTotal|invoiceTotal|platformFee/
    );
  });
});
