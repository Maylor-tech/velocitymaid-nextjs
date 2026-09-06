import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

const cookieGet = vi.fn();
const userFindUnique = vi.fn();
const userBranchFindFirst = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => cookieGet(name) }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    userBranch: { findFirst: (...a: unknown[]) => userBranchFindFirst(...a) },
  },
}));

import { getAuthenticatedBranchOwner } from '@/lib/auth/branchOwnerAuth';

describe('getAuthenticatedBranchOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'owner-1' });
    userBranchFindFirst.mockResolvedValue(null);
  });

  it('looks up BRANCH_OPERATOR, the role that exists on User', async () => {
    userFindUnique.mockResolvedValue({
      id: 'owner-1',
      name: 'Pat',
      email: 'pat@example.com',
      primaryBranchId: 'branch-1',
    });

    const result = await getAuthenticatedBranchOwner();

    expect(userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'owner-1',
          role: UserRole.BRANCH_OPERATOR,
          isActive: true,
        }),
      })
    );
    expect(result.success).toBe(true);
    expect(result.branchId).toBe('branch-1');
  });
});
