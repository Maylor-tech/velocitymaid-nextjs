import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  set: vi.fn(), user: vi.fn(), branches: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({
  get: (name: string) => name === 'admin_session' && state.cookie ? { value: state.cookie } : undefined,
  set: state.set,
}) }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  user: { findUnique: state.user }, userBranch: { findMany: state.branches },
} }));

import { signPreviewAdminSession, verifyPreviewAdminSession } from '../previewAdminSession';
import { previewAdminLogin } from '../previewAdminLogin';
import { verifyAdminSession } from '../adminSession';
import { requireRole, getAdminAuthFromCookies } from '../requireRole';
import { POST } from '@/app/api/auth/admin-login/route';
import { middleware } from '@/middleware';

const password = 'FICTIONAL TEST PASSWORD ONLY';
const signingSecret = 'FICTIONAL ADMIN SIGNING SECRET FOR TESTS ONLY';
const base = 'https://fictional-billing-preview.vercel.app';
const payload = { userId: 'fictional-admin', role: 'ADMIN' as const,
  isOwner: false, isBranchScoped: false, branchIds: ['nj-test', 'vt-test'] };

function login(body: unknown, origin = base) {
  return new NextRequest(base + '/api/auth/admin-login', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function request(path = '/api/admin/me', raw = state.cookie, extra: Record<string, string> = {}) {
  return new NextRequest(base + path, { headers: {
    ...(raw ? { cookie: 'admin_session=' + encodeURIComponent(raw) } : {}), ...extra,
  } });
}
function sessionCookie() {
  const call = state.set.mock.calls.find((entry) => entry[0] === 'admin_session');
  return call as [string, string, { httpOnly: boolean; secure: boolean; sameSite: string; maxAge: number }] | undefined;
}

beforeEach(() => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('ADMIN_SESSION_SECRET', signingSecret);
  vi.stubEnv('ADMIN_PASSWORD_STAGING_ADMIN_EXAMPLE_TEST', password);
  vi.stubEnv('PREVIEW_ADMIN_SESSION_SECRET', 'FICTIONAL SIGNING SECRET FOR TESTS ONLY 123456');
  delete process.env.ADMIN_EMAIL;
  vi.clearAllMocks();
  state.cookie = undefined;
  state.user.mockResolvedValue({ id: payload.userId, email: 'staging.admin@example.test',
    role: 'ADMIN', isActive: true });
  state.branches.mockResolvedValue([
    { branchId: 'nj-test', Branch: { name: 'Fictional NJ' } },
    { branchId: 'vt-test', Branch: { name: 'Fictional VT' } },
  ]);
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('combined administrator login', () => {
  it.each([
    [{}, 401],
    [{ email: 'staging.admin@example.test' }, 401],
    [{ email: 'staging.admin@example.test', password: 'wrong' }, 401],
    [{ email: 'staging.vt.admin@example.test', password }, 503],
  ])('refuses a session for %j', async (body, status) => {
    expect((await POST(login(body))).status).toBe(status);
    expect(sessionCookie()).toBeUndefined();
  });
  it('requires the admin signing secret and the request origin', async () => {
    expect((await POST(login({ email: 'staging.admin@example.test', password }, 'https://other.test'))).status).toBe(403);
    vi.stubEnv('ADMIN_SESSION_SECRET', '');
    expect((await POST(login({ email: 'staging.admin@example.test', password }))).status).toBe(503);
    expect(sessionCookie()).toBeUndefined();
  });
  it('requires a password for a multi-branch admin and issues a signed session', async () => {
    const response = await POST(login({ email: 'staging.admin@example.test', password }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    const issued = sessionCookie();
    expect(issued?.[0]).toBe('admin_session');
    expect(issued?.[2]).toMatchObject({ httpOnly: true, sameSite: 'strict', maxAge: 1800 });
    expect(await verifyAdminSession(issued?.[1])).toMatchObject(payload);
    expect(await verifyPreviewAdminSession(issued?.[1])).toBeNull();
    expect(issued?.[1]).not.toContain(password);
    expect(issued?.[1]).not.toContain(signingSecret);
  });
  it.each([false, null])('rejects an inactive or nonexistent administrator', async active => {
    state.user.mockResolvedValue(active === null ? null : { id: payload.userId, role: 'ADMIN', isActive: false });
    expect((await POST(login({ email: 'staging.admin@example.test', password }))).status).toBe(401);
    expect(sessionCookie()).toBeUndefined();
  });
  it('rejects no branch access', async () => {
    state.branches.mockResolvedValue([]);
    expect((await POST(login({ email: 'staging.admin@example.test', password }))).status).toBe(403);
    expect(sessionCookie()).toBeUndefined();
  });
  it('does not use the preview login handler as the admin route', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect((await previewAdminLogin(login({ email: 'staging.admin@example.test', password }))).status).toBe(404);
  });
});

describe('signed sessions at middleware and data access boundaries', () => {
  it.each(['true', JSON.stringify(payload), '{"userId":"fictional-admin","role":"ADMIN"}'])('rejects editable cookie identity %s', async raw => {
    state.cookie = raw;
    expect((await middleware(request())).status).toBe(401);
    const failure = await requireRole(request(), 'ADMIN').catch(e => e);
    expect(failure.status).toBe(401);
    expect(await getAdminAuthFromCookies()).toBeNull();
    expect(state.user).not.toHaveBeenCalled();
  });
  it('rejects identity headers without a signed session', async () => {
    expect((await middleware(request('/api/admin/me', undefined, { 'x-admin-id': 'fictional-admin' }))).status).toBe(401);
    const failure = await requireRole(request('/api/admin/me', undefined, { authorization: 'Bearer fictional-admin' }), 'ADMIN').catch(e => e);
    expect(failure.status).toBe(401);
  });
  it('rejects a preview-signed cookie on the admin session path', async () => {
    state.cookie = await signPreviewAdminSession({
      userId: payload.userId,
      role: 'ADMIN',
      isBranchScoped: false,
      branchIds: payload.branchIds,
    });
    expect(await verifyPreviewAdminSession(state.cookie)).toMatchObject({
      userId: payload.userId,
      branchIds: payload.branchIds,
    });
    expect((await middleware(request())).status).toBe(401);
    expect((await requireRole(request(), 'ADMIN').catch(e => e)).status).toBe(401);
  });
  it('accepts a valid admin session and rechecks the live account', async () => {
    const response = await POST(login({ email: 'staging.admin@example.test', password }));
    expect(response.status).toBe(200);
    state.cookie = sessionCookie()?.[1];
    expect((await middleware(request())).status).toBe(200);
    expect(await requireRole(request(), 'ADMIN')).toMatchObject({
      userId: payload.userId,
      role: 'ADMIN',
      isOwner: false,
      branchIds: payload.branchIds,
    });
    expect(state.user.mock.calls.at(-1)?.[0].where).toMatchObject({
      id: payload.userId,
      isActive: true,
    });
    state.branches.mockResolvedValue([]);
    expect(await getAdminAuthFromCookies()).toBeNull();
    state.user.mockResolvedValue(null);
    expect((await requireRole(request(), 'ADMIN').catch(e => e)).status).toBe(401);
  });
  it('preserves single-branch restrictions and ignores an alternate identity header', async () => {
    state.branches.mockResolvedValue([{ branchId: 'vt-test' }]);
    const response = await POST(login({ email: 'staging.admin@example.test', password }));
    expect(response.status).toBe(200);
    state.cookie = sessionCookie()?.[1];
    expect(await verifyAdminSession(state.cookie)).toMatchObject({
      isOwner: false,
      isBranchScoped: true,
      branchId: 'vt-test',
      branchIds: ['vt-test'],
    });
    expect((await middleware(request('/api/admin/invoices'))).status).toBe(403);
    expect((await middleware(request('/api/admin/me'))).status).toBe(200);
    expect((await middleware(request('/api/admin/me', state.cookie, { 'x-admin-id': 'other' }))).status).toBe(401);
  });
});
