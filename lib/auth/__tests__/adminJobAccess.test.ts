import { beforeEach, describe, expect, it, vi } from 'vitest';

const findJob = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { job: { findUnique: (...args: unknown[]) => findJob(...args) } },
}));

import { assertAdminJobRecord, jobBranchWhere } from '../adminJobAccess';

const multi = {
  userId: 'multi-1',
  role: 'ADMIN' as const,
  isOwner: false,
  branchIds: ['fictional-vt', 'fictional-nj'],
};
const owner = {
  userId: 'owner-1',
  role: 'ADMIN' as const,
  isOwner: true,
  branchIds: ['fictional-vt', 'fictional-nj'],
};

describe('non-owner job branch scope', () => {
  beforeEach(() => findJob.mockReset());

  it('limits an omitted branch filter to verified memberships', () => {
    expect(jobBranchWhere(multi, null)).toEqual({
      branchId: { in: ['fictional-vt', 'fictional-nj'] },
    });
    expect(jobBranchWhere(multi, '')).toEqual({
      branchId: { in: ['fictional-vt', 'fictional-nj'] },
    });
    expect(jobBranchWhere(multi, 'all')).toEqual({
      branchId: { in: ['fictional-vt', 'fictional-nj'] },
    });
    expect(jobBranchWhere(owner, null)).toEqual({});
  });

  it('rejects an unassigned branch on a query and on a job record', async () => {
    expect(() => jobBranchWhere(multi, 'fictional-other')).toThrowError(
      expect.objectContaining({ status: 403 })
    );
    expect(jobBranchWhere(multi, 'fictional-vt')).toEqual({ branchId: 'fictional-vt' });

    findJob.mockResolvedValue({ branchId: 'fictional-other' });
    await expect(assertAdminJobRecord(multi, 'job-1')).rejects.toEqual(
      expect.objectContaining({ status: 403 })
    );
    findJob.mockResolvedValue({ branchId: 'fictional-nj' });
    await expect(assertAdminJobRecord(multi, 'job-2')).resolves.toBeUndefined();
    findJob.mockResolvedValue({ branchId: 'fictional-other' });
    await expect(assertAdminJobRecord(owner, 'job-3')).resolves.toBeUndefined();
  });
});
