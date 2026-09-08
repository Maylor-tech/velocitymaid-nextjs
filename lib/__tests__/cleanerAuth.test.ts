import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

const cookieGet = vi.fn();
const userFindUnique = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => cookieGet(name) }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => userFindUnique(...args) },
  },
}));

import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';

describe('getAuthenticatedCleaner cookie identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valid cleaner User.id cookie authenticates', async () => {
    cookieGet.mockReturnValue({ value: 'user-dorottya' });
    userFindUnique.mockResolvedValue({
      id: 'user-dorottya',
      name: 'Dorottya',
      email: 'dorottya@example.com',
    });

    const auth = await getAuthenticatedCleaner();
    expect(auth.success).toBe(true);
    expect(auth.cleanerId).toBe('user-dorottya');
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-dorottya', role: UserRole.CLEANER, isActive: true },
      select: { id: true, name: true, email: true },
    });
  });

  it('arbitrary/hash cookie does not authenticate', async () => {
    const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    cookieGet.mockReturnValue({ value: hash });
    userFindUnique.mockResolvedValue(null);

    const auth = await getAuthenticatedCleaner();
    expect(auth.success).toBe(false);
    expect(auth.cleanerId).toBeUndefined();
  });
});
