import { describe, expect, it, vi, beforeEach } from 'vitest';
import { JobStatus } from '@prisma/client';
import { isCompletedCustomerJob, tipUrlForJob } from '@/lib/tips/tipLinks';

const mocks = vi.hoisted(() => ({
  jobFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: (...a: unknown[]) => mocks.jobFindUnique(...a) },
    user: { findFirst: (...a: unknown[]) => mocks.userFindFirst(...a) },
  },
}));

import { getTipJobContext } from '@/lib/tips/tipJobContext';
import { TipBeneficiaryError } from '@/lib/tips/beneficiary';

describe('tipUrlForJob', () => {
  it('builds canonical tip URL with encoded jobId', () => {
    expect(tipUrlForJob('abc123')).toBe('/tip?jobId=abc123');
    expect(tipUrlForJob('a/b')).toBe('/tip?jobId=a%2Fb');
  });
});

describe('isCompletedCustomerJob', () => {
  it('detects COMPLETED from rawStatus / serviceStatus / badge', () => {
    expect(isCompletedCustomerJob({ rawStatus: 'COMPLETED' })).toBe(true);
    expect(isCompletedCustomerJob({ serviceStatus: 'COMPLETED' })).toBe(true);
    expect(isCompletedCustomerJob({ status: 'completed' })).toBe(true);
    expect(isCompletedCustomerJob({ status: 'assigned', rawStatus: 'ASSIGNED' })).toBe(
      false
    );
  });
});

describe('getTipJobContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns property label for tip-eligible completed job', async () => {
    mocks.jobFindUnique
      .mockResolvedValueOnce({
        id: 'job-1',
        status: JobStatus.COMPLETED,
        assignedCleanerId: 'cleaner-1',
        propertyId: 'p1',
        branchId: 'b1',
        marketLabel: 'vermont',
        completedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'job-1',
        status: JobStatus.COMPLETED,
        serviceType: 'Turnover',
        preferredDate: new Date('2026-09-15T12:00:00.000Z'),
        address: '123 Main St',
        jobReference: 'VM-2026-0040',
        Property: { name: 'Maple Cabin', address: '123 Main St' },
      });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });

    const ctx = await getTipJobContext('job-1');
    expect(ctx.propertyLabel).toBe('Maple Cabin');
    expect(ctx.jobReference).toBe('VM-2026-0040');
    expect(ctx.serviceType).toBe('Turnover');
    expect(ctx.eligible).toBe(true);
  });

  it('rejects incomplete jobs', async () => {
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-2',
      status: JobStatus.ASSIGNED,
      assignedCleanerId: 'cleaner-1',
      propertyId: null,
      branchId: 'b1',
      marketLabel: null,
      completedAt: null,
    });

    await expect(getTipJobContext('job-2')).rejects.toBeInstanceOf(
      TipBeneficiaryError
    );
  });
});
