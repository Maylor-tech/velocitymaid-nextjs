import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  propertyFindUnique: vi.fn(),
  propertyUpdate: vi.fn(),
  rateCreate: vi.fn(),
  rateUpdateMany: vi.fn(),
  rateDeleteMany: vi.fn(),
  getCustomerSession: vi.fn(),
  loadOwnedProperty: vi.fn(),
  resolveStayToGuestFeedback: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    property: {
      findUnique: mocks.propertyFindUnique,
      update: mocks.propertyUpdate,
    },
    apiRateLimitBucket: {
      create: mocks.rateCreate,
      updateMany: mocks.rateUpdateMany,
      deleteMany: mocks.rateDeleteMany,
    },
  },
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: mocks.getCustomerSession,
}));

vi.mock('@/lib/properties/propertyService', () => ({
  loadOwnedProperty: mocks.loadOwnedProperty,
}));

vi.mock('@/lib/stay/resolveStay', () => ({
  resolveStayToGuestFeedback: mocks.resolveStayToGuestFeedback,
}));

import {
  checkStayResolveRateLimit,
  STAY_RESOLVE_MAX_PER_WINDOW,
  _resetStayResolveRateLimitForTests,
} from '@/lib/stay/rateLimit';
import {
  ensurePropertyGuestAccessToken,
  getPropertyGuestAccessState,
} from '@/lib/stay/propertyGuestAccess';
import { GET as guestAccessGet, POST as guestAccessPost } from '@/app/api/customer/properties/[propertyId]/guest-access/route';
import { POST as stayResolvePost } from '@/app/api/stay/[token]/resolve/route';

vi.mock('@/lib/audit', () => ({
  logAuditEntry: vi.fn().mockResolvedValue('audit-1'),
}));

describe('GET guest-access is strictly read-only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCustomerSession.mockResolvedValue({ customerId: 'cust-1' });
    mocks.loadOwnedProperty.mockResolvedValue({ id: 'prop-1' });
  });

  it('GET does not mutate token state when none exists', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      guestAccessToken: null,
      guestAccessRevokedAt: null,
      guestDisplayName: null,
      guestAccessTokenCreatedAt: null,
      Customer: { archivedAt: null },
    });

    const res = await guestAccessGet(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access'),
      { params: { propertyId: 'prop-1' } }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      active: false,
      stayUrl: null,
    });
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
  });

  it('revoked property remains revoked after GET / page load', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      guestAccessToken: 'old-token-still-present',
      guestAccessRevokedAt: new Date('2026-09-01T00:00:00.000Z'),
      guestDisplayName: 'Cabin',
      guestAccessTokenCreatedAt: new Date('2026-08-01T00:00:00.000Z'),
      Customer: { archivedAt: null },
    });

    const state = await getPropertyGuestAccessState('prop-1');
    expect(state.active).toBe(false);
    expect(state.stayUrl).toBeNull();

    const res = await guestAccessGet(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access'),
      { params: { propertyId: 'prop-1' } }
    );
    const body = await res.json();
    expect(body.active).toBe(false);
    expect(body.stayUrl).toBeNull();
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
  });

  it('POST ensure explicitly re-enables/creates after revoke', async () => {
    mocks.propertyFindUnique.mockResolvedValue({
      guestAccessToken: 'old-token',
      guestAccessRevokedAt: new Date('2026-09-01T00:00:00.000Z'),
      guestDisplayName: 'Cabin',
      Customer: { archivedAt: null },
    });
    mocks.propertyUpdate.mockResolvedValue({});

    const ensured = await ensurePropertyGuestAccessToken(
      'prop-1',
      { actorRole: 'CUSTOMER', customerId: 'cust-1' },
      { guestDisplayName: 'Cabin' }
    );
    expect(ensured.created).toBe(true);
    expect(ensured.stayUrl).toMatch(/\/stay\//);
    expect(mocks.propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          guestAccessRevokedAt: null,
          guestAccessToken: expect.any(String),
        }),
      })
    );

    mocks.propertyUpdate.mockClear();
    mocks.propertyFindUnique.mockResolvedValue({
      guestAccessToken: null,
      guestAccessRevokedAt: null,
      guestDisplayName: null,
      Customer: { archivedAt: null },
    });

    const res = await guestAccessPost(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'ensure',
            guestDisplayName: 'Cabin',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      ),
      { params: { propertyId: 'prop-1' } }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.active).toBe(true);
    expect(body.stayUrl).toMatch(/\/stay\//);
    expect(mocks.propertyUpdate).toHaveBeenCalled();
  });
});

describe('Durable Postgres stay resolve rate limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows up to max then blocks using updateMany semantics', async () => {
    mocks.rateCreate.mockRejectedValue(new Error('Unique constraint'));
    mocks.rateUpdateMany
      .mockResolvedValueOnce({ count: 0 }) // not expired
      .mockResolvedValue({ count: 1 }); // increments succeed

    for (let i = 0; i < STAY_RESOLVE_MAX_PER_WINDOW; i++) {
      await expect(checkStayResolveRateLimit('ip:abc')).resolves.toBe(true);
    }

    // Next call: reset fails, increment fails → blocked
    mocks.rateUpdateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });
    await expect(checkStayResolveRateLimit('ip:abc')).resolves.toBe(false);
  });

  it('creates a new durable bucket on first hit', async () => {
    mocks.rateCreate.mockResolvedValue({ id: 'b1', count: 1 });
    await expect(checkStayResolveRateLimit('ip:first')).resolves.toBe(true);
    expect(mocks.rateCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bucketKey: 'stay-resolve:ip:first',
          count: 1,
        }),
      })
    );
  });

  it('public resolve route wires durable rate limit (429 before resolve)', async () => {
    mocks.rateCreate.mockRejectedValue(new Error('Unique constraint'));
    mocks.rateUpdateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });

    const res = await stayResolvePost(
      new NextRequest('http://localhost/api/stay/opaque-token-xyz/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({ checkoutDate: '2026-10-04' }),
      }),
      { params: { token: 'opaque-token-xyz' } }
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(mocks.resolveStayToGuestFeedback).not.toHaveBeenCalled();
  });

  it('_resetStayResolveRateLimitForTests deletes stay-resolve buckets only', async () => {
    mocks.rateDeleteMany.mockResolvedValue({ count: 2 });
    await _resetStayResolveRateLimitForTests();
    expect(mocks.rateDeleteMany).toHaveBeenCalledWith({
      where: { bucketKey: { startsWith: 'stay-resolve:' } },
    });
  });
});
