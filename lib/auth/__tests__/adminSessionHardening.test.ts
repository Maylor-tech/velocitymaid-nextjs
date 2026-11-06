import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  set: vi.fn(),
  delete: vi.fn(),
  ownerActive: true,
  memberships: {
    'owner-1': ['fictional-vt', 'fictional-nj'],
    'multi-1': ['fictional-vt', 'fictional-nj'],
    'single-1': ['fictional-vt'],
  } as Record<string, string[]>,
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => name === 'admin_session' && state.cookie ? { value: state.cookie } : undefined,
    set: state.set,
    delete: state.delete,
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (query: { where: { email?: string; id?: string } }) => {
      const email = query.where.email;
      const id = query.where.id;
      const row = email === 'owner@example.test' || id === 'owner-1'
        ? { id: 'owner-1', email: 'owner@example.test' }
        : email === 'multi@example.test' || id === 'multi-1'
          ? { id: 'multi-1', email: 'multi@example.test' }
          : email === 'single@example.test' || id === 'single-1'
            ? { id: 'single-1', email: 'single@example.test' }
            : null;
      if (!row) return null;
      if (row.id === 'owner-1' && !state.ownerActive) return null;
      return { ...row, role: 'ADMIN', isActive: true };
    } },
    userBranch: { findMany: (query: { where: { userId: string } }) => {
      const ids = state.memberships[query.where.userId] ?? [];
      return ids.map((branchId) => ({ branchId, Branch: { name: branchId } }));
    } },
  },
}));

import { signAdminSession, verifyAdminSession } from '../adminSession';
import { assertOwnerAuthorization, getAdminAuthFromCookies, requireRole } from '../requireRole';
import { POST } from '@/app/api/auth/admin-login/route';
import { GET as logout } from '@/app/api/auth/admin-logout/route';
import { middleware } from '@/middleware';
import { requireAuth } from '../requireAuth';

const password = 'FICTIONAL ADMIN PASSWORD';
const base = 'https://fictional-admin.example.test';
const secret = 'FICTIONAL ADMIN SIGNING SECRET FOR TESTS ONLY';

function login(body: unknown, origin = base) {
  return new NextRequest(base + '/api/auth/admin-login', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function request(path: string, raw = state.cookie, extra: Record<string, string> = {}) {
  return new NextRequest(base + path, {
    headers: {
      ...(raw ? { cookie: 'admin_session=' + encodeURIComponent(raw) } : {}),
      ...extra,
    },
  });
}

function setCookieHeaders(response: Response): string[] {
  return typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
}

function expectLegacyScopesCleared(response: Response) {
  for (const name of ['adminId', 'adminSession'] as const) {
    const clears = setCookieHeaders(response).filter((cookie) => cookie.startsWith(`${name}=`));
    expect(clears).toHaveLength(2);
    expect(clears.every((cookie) => cookie.includes('Path=/') && cookie.includes('Max-Age=0'))).toBe(true);
    expect(clears.filter((cookie) => !cookie.includes('Domain='))).toHaveLength(1);
    expect(clears.filter((cookie) => cookie.includes('Domain=velocitymaid.com'))).toHaveLength(1);
  }
}

function issuedSession(response: Response): string {
  const header = setCookieHeaders(response).find((cookie) => cookie.startsWith('admin_session=') && cookie.includes('Max-Age=1800'));
  expect(header).toBeTruthy();
  return decodeURIComponent(header!.slice('admin_session='.length).split(';', 1)[0]);
}

beforeEach(() => {
  vi.stubEnv('ADMIN_SESSION_SECRET', secret);
  vi.stubEnv('ADMIN_EMAIL', 'owner@example.test');
  vi.stubEnv('ADMIN_PASSWORD_OWNER_EXAMPLE_TEST', password);
  vi.stubEnv('ADMIN_PASSWORD_MULTI_EXAMPLE_TEST', password);
  vi.stubEnv('ADMIN_PASSWORD_SINGLE_EXAMPLE_TEST', password);
  state.cookie = undefined;
  state.ownerActive = true;
  state.memberships['owner-1'] = ['fictional-vt', 'fictional-nj'];
  state.memberships['multi-1'] = ['fictional-vt', 'fictional-nj'];
  state.memberships['single-1'] = ['fictional-vt'];
  state.set.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('credentials for every active admin', () => {
  it.each([
    { email: 'owner@example.test' },
    { email: 'multi@example.test' },
    { email: 'owner@example.test', password: 'wrong-password-value' },
    { email: 'nobody@example.test', password },
  ])('rejects passwordless or wrong credentials %j', async (body) => {
    const response = await POST(login(body));
    expect(response.status).toBe(401);
    expect(setCookieHeaders(response).some((cookie) => cookie.includes('Max-Age=1800'))).toBe(false);
    expectLegacyScopesCleared(response);
  });

  it('rejects a cross-origin login and a missing signing secret', async () => {
    const crossOrigin = await POST(login({ email: 'owner@example.test', password }, 'https://other.example.test'));
    expect(crossOrigin.status).toBe(403);
    expectLegacyScopesCleared(crossOrigin);
    vi.stubEnv('ADMIN_SESSION_SECRET', '');
    const unconfigured = await POST(login({ email: 'owner@example.test', password }));
    expect(unconfigured.status).toBe(503);
    expect(setCookieHeaders(unconfigured).some((cookie) => cookie.includes('Max-Age=1800'))).toBe(false);
    expectLegacyScopesCleared(unconfigured);
  });

  it('issues a signed session only after the owner password matches', async () => {
    const response = await POST(login({ email: 'owner@example.test', password }));
    expect(response.status).toBe(200);
    const token = issuedSession(response);
    const sessionHeader = setCookieHeaders(response).find((cookie) => cookie.startsWith('admin_session='));
    expect(sessionHeader).toContain('HttpOnly');
    expect(sessionHeader).toContain('SameSite=strict');
    expect(sessionHeader).toContain('Path=/');
    expect(sessionHeader).toContain('Max-Age=1800');
    expect(sessionHeader).not.toContain('Domain=');
    expectLegacyScopesCleared(response);
    expect(await verifyAdminSession(token)).toMatchObject({
      userId: 'owner-1', isOwner: true, isBranchScoped: false,
    });
    expect(token).not.toContain(password);
    expect(token).not.toContain(secret);
  });
});

describe('forged cookies, headers, expiry, and live account checks', () => {
  it.each(['true', '{"userId":"owner-1","role":"ADMIN","isOwner":true}'])(
    'rejects forged admin cookie %s',
    async (raw) => {
      state.cookie = raw;
      expect((await middleware(request('/api/admin/me'))).status).toBe(401);
      expect((await requireRole(request('/api/admin/me'), 'ADMIN').catch((error) => error)).status).toBe(401);
      expect(await getAdminAuthFromCookies()).toBeNull();
    }
  );

  it('rejects identity headers and legacy cookies without trusting them', async () => {
    expect((await middleware(request('/api/admin/me', undefined, { 'x-admin-id': 'owner-1' }))).status).toBe(401);
    expect((await middleware(request('/api/admin/me', undefined, { authorization: 'Bearer owner-1' }))).status).toBe(401);
    const stalePage = await middleware(request('/admin/jobs', undefined, { cookie: 'adminId=owner-1' }));
    expect(stalePage.status).toBeGreaterThanOrEqual(300);
    expect(stalePage.headers.get('location')).toContain('/admin/login');
    expect((await requireAuth(request('/api/saas/me', undefined, { 'x-admin-id': 'owner-1' })).catch((error) => error)).status).toBe(401);
  });

  it('rejects a tampered signature', async () => {
    const signed = JSON.parse(await signAdminSession({
      userId: 'multi-1', role: 'ADMIN', isOwner: false, isBranchScoped: false,
      branchIds: ['fictional-nj', 'fictional-vt'],
    }));
    signed.userId = 'owner-1';
    state.cookie = JSON.stringify(signed);
    expect(await verifyAdminSession(state.cookie)).toBeNull();
    expect((await middleware(request('/api/admin/me'))).status).toBe(401);
  });

  it('expires sessions and refuses a different signing secret', async () => {
    state.cookie = await signAdminSession({
      userId: 'owner-1', role: 'ADMIN', isOwner: true, isBranchScoped: false,
      branchIds: ['fictional-nj', 'fictional-vt'],
    });
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 1801 * 1000);
    expect(await verifyAdminSession(state.cookie)).toBeNull();
    vi.useRealTimers();
    vi.stubEnv('ADMIN_SESSION_SECRET', 'A DIFFERENT FICTIONAL SECRET FOR TESTING ONLY');
    expect(await verifyAdminSession(state.cookie)).toBeNull();
  });

  it('rejects an inactive owner and a removed membership on the next request', async () => {
    state.ownerActive = false;
    expect((await POST(login({ email: 'owner@example.test', password }))).status).toBe(401);
    state.ownerActive = true;
    state.cookie = await signAdminSession({
      userId: 'multi-1', role: 'ADMIN', isOwner: false, isBranchScoped: false,
      branchIds: ['fictional-nj', 'fictional-vt'],
    });
    expect((await requireRole(request('/api/admin/jobs'), 'ADMIN')).userId).toBe('multi-1');
    state.memberships['multi-1'] = [];
    expect((await requireRole(request('/api/admin/jobs'), 'ADMIN').catch((error) => error)).status).toBe(401);
    expect(await getAdminAuthFromCookies()).toBeNull();
  });
});

describe('multi-branch admin global billing', () => {
  it('denies a multi-branch admin the global invoice action and allows the owner', async () => {
    state.cookie = await signAdminSession({
      userId: 'multi-1', role: 'ADMIN', isOwner: false, isBranchScoped: false,
      branchIds: ['fictional-nj', 'fictional-vt'],
    });
    const denied = await middleware(request('/api/admin/invoices'));
    expect(denied.status).toBe(403);
    const auth = await requireRole(request('/api/admin/invoices'), 'ADMIN');
    expect(auth.isOwner).toBe(false);
    expect(auth.branchId).toBeUndefined();
    try {
      assertOwnerAuthorization(auth);
      expect.unreachable();
    } catch (error) {
      expect((error as { status: number }).status).toBe(403);
    }

    state.cookie = await signAdminSession({
      userId: 'owner-1', role: 'ADMIN', isOwner: true, isBranchScoped: false,
      branchIds: ['fictional-nj', 'fictional-vt'],
    });
    expect((await middleware(request('/api/admin/invoices'))).status).toBe(200);
    const owner = await requireRole(request('/api/admin/invoices'), 'ADMIN');
    expect(owner.isOwner).toBe(true);
    expect(() => assertOwnerAuthorization(owner)).not.toThrow();
  });
});

describe('stale browser cookies and closed multi-branch routes', () => {
  it('opens the login page with stale cookies and clears legacy aliases on login and logout', async () => {
    const stale = 'admin_session=true; adminId=stale-admin; adminSession=legacy';
    const loginPage = await middleware(request('/admin/login', undefined, { cookie: stale }));
    expect(loginPage.status).toBe(200);
    const jobs = await middleware(request('/admin/jobs', undefined, { cookie: stale }));
    expect(jobs.status).toBeGreaterThanOrEqual(300);
    expect(jobs.headers.get('location')).toContain('/admin/login');
    expect((await middleware(request('/api/admin/jobs', undefined, { cookie: stale }))).status).toBe(401);

    const response = await POST(login({ email: 'multi@example.test', password }));
    expect(response.status).toBe(200);
    expectLegacyScopesCleared(response);
    const signed = issuedSession(response);
    expect((await middleware(request('/api/admin/payouts/run', signed))).status).toBe(403);
    expect((await middleware(request('/api/admin/jobs', signed))).status).toBe(200);
    const loggedOut = await logout(request('/api/auth/admin-logout'));
    expectLegacyScopesCleared(loggedOut);
    expect(setCookieHeaders(loggedOut).some((cookie) => cookie.startsWith('admin_session=') && cookie.includes('Max-Age=0'))).toBe(true);
  });
});

describe('parent-domain legacy cookies', () => {
  it('expires Domain=velocitymaid.com copies that a host-only clear does not match', async () => {
    const response = await POST(login({ email: 'owner@example.test', password }));
    expect(response.status).toBe(200);
    const domainClears = setCookieHeaders(response).filter((cookie) => cookie.includes('Domain=velocitymaid.com'));
    expect(domainClears.map((cookie) => cookie.split('=', 1)[0]).sort()).toEqual(['adminId', 'adminSession']);
    expect(domainClears.every((cookie) => cookie.includes('Path=/') && cookie.includes('Max-Age=0'))).toBe(true);
    const hostClears = setCookieHeaders(response).filter((cookie) => (
      (cookie.startsWith('adminId=') || cookie.startsWith('adminSession=')) && !cookie.includes('Domain=')
    ));
    expect(hostClears).toHaveLength(2);

    const token = issuedSession(response);
    const surviving = `admin_session=${encodeURIComponent(token)}; adminId=parent-domain; adminSession=parent-domain`;
    expect((await middleware(request('/api/admin/me', undefined, { cookie: surviving }))).status).toBe(401);
    expect((await middleware(request('/admin/jobs', undefined, { cookie: surviving }))).status).toBeGreaterThanOrEqual(300);
  });

  it('accepts the signed session once the legacy names are no longer sent', async () => {
    const response = await POST(login({ email: 'owner@example.test', password }));
    const token = issuedSession(response);
    state.cookie = token;
    expect((await middleware(request('/api/admin/me'))).status).toBe(200);
    expect((await requireRole(request('/api/admin/me'), 'ADMIN')).isOwner).toBe(true);
  });

  it('keeps a legacy-only request unauthorized', async () => {
    const legacy = 'adminId=parent-domain; adminSession=parent-domain';
    expect((await middleware(request('/api/admin/me', undefined, { cookie: legacy }))).status).toBe(401);
    const page = await middleware(request('/admin/jobs', undefined, { cookie: legacy }));
    expect(page.status).toBeGreaterThanOrEqual(300);
    expect(page.headers.get('location')).toContain('/admin/login');
  });
});
