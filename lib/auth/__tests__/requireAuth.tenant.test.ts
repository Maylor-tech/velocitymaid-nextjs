import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';

const cookieGet = vi.fn();
const userFindUnique = vi.fn();
const verifyToken = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => cookieGet(name) }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
  },
}));

vi.mock('@/lib/auth/jwt', () => ({
  verifyToken: (...a: unknown[]) => verifyToken(...a),
}));

vi.mock('@/lib/auth/adminBypass', () => ({
  allowLegacyAdminBypass: () => false,
  isLegacyAdminSession: () => false,
}));

import { requireAuth } from '@/lib/auth/requireAuth';

describe('requireAuth tenant binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue(undefined);
    userFindUnique.mockReset();
    verifyToken.mockReset();
  });

  it('uses tenantId from the SaaS JWT payload, not a User column', async () => {
    cookieGet.mockImplementation((name: string) =>
      name === 'saas_token' ? { value: 'token' } : undefined
    );
    verifyToken.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-from-jwt',
      email: 'ops@example.com',
      role: 'ADMIN',
    });
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ops@example.com',
      role: UserRole.ADMIN,
    });

    const auth = await requireAuth();

    expect(auth.tenantId).toBe('tenant-from-jwt');
    expect(auth.userId).toBe('user-1');
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1', isActive: true },
      select: { id: true, email: true, role: true },
    });
  });

  it('returns 401 when no session cookie or admin id is present', async () => {
    const error = await requireAuth().catch((e) => e);
    expect(error).toBeInstanceOf(NextResponse);
    expect((error as NextResponse).status).toBe(401);
  });
});
