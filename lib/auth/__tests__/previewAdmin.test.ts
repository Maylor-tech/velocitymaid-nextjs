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
import { requireRole, getAdminAuthFromCookies } from '../requireRole';
import { POST } from '@/app/api/auth/admin-login/route';
import { middleware } from '@/middleware';

const password = 'FICTIONAL TEST PASSWORD ONLY';
const base = 'https://fictional-billing-preview.vercel.app';
const payload = { userId: 'fictional-admin', role: 'ADMIN',
  isBranchScoped: false, branchIds: ['nj-test', 'vt-test'] };

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

beforeEach(() => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('PREVIEW_ADMIN_SESSION_SECRET', 'FICTIONAL SIGNING SECRET FOR TESTS ONLY 123456');
  vi.stubEnv('ADMIN_PASSWORD_STAGING_ADMIN_EXAMPLE_TEST', password);
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

describe('Preview administrator credentials', () => {
  it.each([{}, { email: 'staging.admin@example.test' },
    { email: 'staging.admin@example.test', password: 'wrong' },
    { email: 'staging.vt.admin@example.test', password }])('rejects missing/wrong credentials %j', async body => {
    expect((await POST(login(body))).status).toBe(401);
    expect(state.user).not.toHaveBeenCalled();
    expect(state.set).not.toHaveBeenCalled();
  });
  it('requires configuration and same origin', async () => {
    expect((await POST(login({ email: 'staging.admin@example.test', password }, 'https://other.test'))).status).toBe(403);
    vi.stubEnv('PREVIEW_ADMIN_SESSION_SECRET', '');
    expect((await POST(login({ email: 'staging.admin@example.test', password }))).status).toBe(503);
    expect(state.set).not.toHaveBeenCalled();
  });
  it('requires password even with two memberships and issues only a signed HttpOnly session', async () => {
    const response = await POST(login({ email: 'staging.admin@example.test', password }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    const [name, token, flags] = state.set.mock.calls[0];
    expect(name).toBe('admin_session');
    expect(flags).toMatchObject({ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 1800 });
    expect(await verifyPreviewAdminSession(token)).toMatchObject(payload);
    expect(token).not.toContain(password);
    expect(token).not.toContain(process.env.PREVIEW_ADMIN_SESSION_SECRET);
  });
  it.each([false, null])('rejects an inactive or nonexistent administrator', async active => {
    state.user.mockResolvedValue(active === null ? null : { id: payload.userId, role: 'ADMIN', isActive: false });
    expect((await POST(login({ email: 'staging.admin@example.test', password }))).status).toBe(401);
  });
  it('rejects no branch access', async () => {
    state.branches.mockResolvedValue([]);
    expect((await POST(login({ email: 'staging.admin@example.test', password }))).status).toBe(403);
  });
  it('does not enable the Preview login handler outside Preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect((await previewAdminLogin(login({ email: 'staging.admin@example.test', password }))).status).toBe(404);
    expect(state.user).not.toHaveBeenCalled();
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
  it('rejects tampered identity, scope, signature and extra fields', async () => {
    const raw = JSON.parse(await signPreviewAdminSession(payload));
    for (const changed of [{ ...raw, userId: 'other' }, { ...raw, branchIds: ['other'] },
      { ...raw, isBranchScoped: true, branchId: 'other' }, { ...raw, signature: 'invalid' },
      { ...raw, injected: true }]) {
      state.cookie = JSON.stringify(changed);
      expect(await verifyPreviewAdminSession(state.cookie)).toBeNull();
      expect((await middleware(request())).status).toBe(401);
    }
  });
  it('accepts valid signed sessions and rechecks active user/memberships in DB', async () => {
    state.cookie = await signPreviewAdminSession(payload);
    expect((await middleware(request())).status).toBe(200);
    expect(await requireRole(request(), 'ADMIN')).toMatchObject({ userId: payload.userId, role: 'ADMIN' });
    expect(state.user.mock.calls[0][0].where).toMatchObject({ isActive: true, email: 'staging.admin@example.test' });
    state.branches.mockResolvedValue([]);
    expect(await getAdminAuthFromCookies()).toBeNull();
    state.user.mockResolvedValue(null);
    expect((await requireRole(request(), 'ADMIN').catch(e => e)).status).toBe(401);
  });
  it('preserves single-branch restrictions and forbids alternate identity aliases', async () => {
    state.cookie = await signPreviewAdminSession({ ...payload, branchIds: ['vt-test'],
      isBranchScoped: true, branchId: 'vt-test' });
    expect((await middleware(request('/api/admin/invoices'))).status).toBe(403);
    expect((await middleware(request('/api/admin/me'))).status).toBe(200);
    expect((await middleware(request('/api/admin/me', state.cookie, { 'x-admin-id': 'other' }))).status).toBe(401);
  });
  it('expires sessions and refuses missing/changed signing keys', async () => {
    state.cookie = await signPreviewAdminSession(payload);
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 1801 * 1000);
    expect(await verifyPreviewAdminSession(state.cookie)).toBeNull();
    vi.useRealTimers();
    vi.stubEnv('PREVIEW_ADMIN_SESSION_SECRET', 'A DIFFERENT FICTIONAL SECRET FOR TESTING');
    expect(await verifyPreviewAdminSession(state.cookie)).toBeNull();
    vi.stubEnv('PREVIEW_ADMIN_SESSION_SECRET', '');
    expect(await verifyPreviewAdminSession(state.cookie)).toBeNull();
  });
});
