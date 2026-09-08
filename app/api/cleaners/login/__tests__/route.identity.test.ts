/**
 * Cleaner login identity: cookie must be User.id for email and phone.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

const cookieSet = vi.fn();
const userFindFirst = vi.fn();
const userFindMany = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: (...args: unknown[]) => cookieSet(...args),
    delete: vi.fn(),
    get: vi.fn(),
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => userFindFirst(...args),
      findMany: (...args: unknown[]) => userFindMany(...args),
    },
  },
}));

import { POST } from '@/app/api/cleaners/login/route';

const USER_ID = 'user-dorottya';
const EMAIL = 'dorottya@example.com';
const PHONE = '+18025550100';

function loginRequest(identifier: string) {
  return new NextRequest('http://localhost/api/cleaners/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  });
}

describe('POST /api/cleaners/login identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('email login sets cleanerId cookie to User.id', async () => {
    userFindFirst.mockResolvedValue({ id: USER_ID });
    const res = await POST(loginRequest(EMAIL));
    expect(res.status).toBe(200);
    expect(userFindFirst).toHaveBeenCalledWith({
      where: { email: EMAIL, role: UserRole.CLEANER, isActive: true },
      select: { id: true },
    });
    expect(cookieSet).toHaveBeenCalledWith(
      'cleanerId',
      USER_ID,
      expect.objectContaining({ httpOnly: true, path: '/' })
    );
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it('phone login sets cleanerId cookie to User.id', async () => {
    userFindMany.mockResolvedValue([{ id: USER_ID, phone: '8025550100' }]);
    const res = await POST(loginRequest(PHONE));
    expect(res.status).toBe(200);
    expect(userFindMany).toHaveBeenCalledWith({
      where: {
        role: UserRole.CLEANER,
        isActive: true,
        phone: { not: null },
      },
      select: { id: true, phone: true },
    });
    expect(cookieSet).toHaveBeenCalledWith(
      'cleanerId',
      USER_ID,
      expect.objectContaining({ httpOnly: true, path: '/' })
    );
  });

  it('formatted phone match works', async () => {
    userFindMany.mockResolvedValue([{ id: USER_ID, phone: '(802) 555-0100' }]);
    const res = await POST(loginRequest('+1 802-555-0100'));
    expect(res.status).toBe(200);
    expect(cookieSet).toHaveBeenCalledWith(
      'cleanerId',
      USER_ID,
      expect.objectContaining({ httpOnly: true })
    );
  });

  it('unknown phone returns 404 and does not set a hash cookie', async () => {
    userFindMany.mockResolvedValue([]);
    const res = await POST(loginRequest(PHONE));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/phone/i);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('inactive cleaner is rejected', async () => {
    userFindMany.mockResolvedValue([]);
    const res = await POST(loginRequest(PHONE));
    expect(res.status).toBe(404);
    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true, role: UserRole.CLEANER }),
      })
    );
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('non-CLEANER User is rejected', async () => {
    userFindFirst.mockResolvedValue(null);
    const res = await POST(loginRequest(EMAIL));
    expect(res.status).toBe(404);
    expect(userFindFirst).toHaveBeenCalledWith({
      where: { email: EMAIL, role: UserRole.CLEANER, isActive: true },
      select: { id: true },
    });
    expect(cookieSet).not.toHaveBeenCalled();
  });
});
