import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const cookieGet = vi.fn();
const userFindUnique = vi.fn();
const userBranchFindMany = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => cookieGet(name) }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    userBranch: { findMany: (...a: unknown[]) => userBranchFindMany(...a) },
  },
}));

import { readAdminCookie, requireRole } from '@/lib/auth/requireRole';

const SESSION = JSON.stringify({
  userId: 'admin-1',
  role: 'ADMIN',
  isBranchScoped: false,
});

function requestWithCookie(cookieHeader?: string): NextRequest {
  return {
    cookies: {
      get: (name: string) => {
        if (!cookieHeader) return undefined;
        if (name === 'admin_session' && cookieHeader.includes('admin_session=')) {
          return { value: SESSION };
        }
        return undefined;
      },
    },
    headers: { get: () => null },
  } as unknown as NextRequest;
}

describe('readAdminCookie', () => {
  it('prefers next/headers cookies(), then the request cookie of the same name', () => {
    const headerStore = { get: (name: string) => (name === 'admin_session' ? { value: 'from-headers' } : undefined) };
    const request = requestWithCookie('admin_session=x');
    expect(readAdminCookie(headerStore, request, 'admin_session')).toBe('from-headers');

    const emptyStore = { get: () => undefined };
    expect(readAdminCookie(emptyStore, request, 'admin_session')).toBe(SESSION);
    expect(readAdminCookie(emptyStore, requestWithCookie(), 'admin_session')).toBeUndefined();
  });
});

describe('requireRole ADMIN session cookie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userBranchFindMany.mockResolvedValue([]);
    userFindUnique.mockResolvedValue({ id: 'admin-1', email: 'brian@velocitymaid.com' });
  });

  it('rejects an unsigned admin_session even when the request cookie is present', async () => {
    cookieGet.mockReturnValue(undefined);

    const error = await requireRole(requestWithCookie('admin_session=present'), 'ADMIN').catch(
      (e) => e
    );

    expect(error).toBeInstanceOf(NextResponse);
    expect((error as NextResponse).status).toBe(401);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it('returns 401 when no admin_session is present on either cookie store', async () => {
    cookieGet.mockReturnValue(undefined);

    const error = await requireRole(requestWithCookie(), 'ADMIN').catch((e) => e);
    expect(error).toBeInstanceOf(NextResponse);
    expect((error as NextResponse).status).toBe(401);
  });

  it('does not treat a non-ADMIN user as authorized', async () => {
    cookieGet.mockReturnValue(undefined);
    userFindUnique.mockResolvedValue(null);

    const error = await requireRole(requestWithCookie('admin_session=present'), 'ADMIN').catch(
      (e) => e
    );
    expect(error).toBeInstanceOf(NextResponse);
    expect((error as NextResponse).status).toBe(401);
  });
});
