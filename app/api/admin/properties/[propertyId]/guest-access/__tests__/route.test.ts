/**
 * Admin guest-access API — break-glass inspect/revoke (Phase 1D-A).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  propertyFindUnique: vi.fn(),
  propertyUpdate: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => mocks.logAuditEntry(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    property: {
      findUnique: (...a: unknown[]) => mocks.propertyFindUnique(...a),
      update: (...a: unknown[]) => mocks.propertyUpdate(...a),
    },
  },
}));

import {
  GET as adminGet,
  POST as adminPost,
} from '@/app/api/admin/properties/[propertyId]/guest-access/route';
import { GUEST_ACCESS_AUDIT } from '@/lib/stay/propertyGuestAccess';

const TOKEN = 'opaque-guest-token-abcdefghijklmnopqrstuvwxyz012345';

describe('Admin property guest-access API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
    mocks.requireRole.mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' });
    mocks.propertyUpdate.mockResolvedValue({});
  });

  it('GET inspects without raw token field; POST revoke requires confirm', async () => {
    mocks.propertyFindUnique
      .mockResolvedValueOnce({
        id: 'prop-1',
        name: 'Cabin',
        guestDisplayName: 'Birch',
        customerId: 'cust-1',
        Customer: {
          id: 'cust-1',
          email: 'h@example.com',
          firstName: 'Host',
          lastName: 'Person',
          archivedAt: null,
        },
      })
      .mockResolvedValueOnce({
        guestAccessToken: TOKEN,
        guestAccessTokenCreatedAt: new Date('2026-09-01T00:00:00.000Z'),
        guestAccessRevokedAt: null,
        guestDisplayName: 'Birch',
        Customer: { archivedAt: null },
      });

    const inspect = await adminGet(
      new NextRequest('http://localhost/api/admin/properties/prop-1/guest-access'),
      { params: { propertyId: 'prop-1' } }
    );
    expect(inspect.status).toBe(200);
    const body = await inspect.json();
    expect(body.guestAccess.active).toBe(true);
    expect(body.guestAccess).not.toHaveProperty('guestAccessToken');
    expect(body).not.toHaveProperty('token');

    mocks.propertyFindUnique.mockResolvedValue({ id: 'prop-1' });
    const denied = await adminPost(
      new NextRequest('http://localhost/api/admin/properties/prop-1/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      }),
      { params: { propertyId: 'prop-1' } }
    );
    expect(denied.status).toBe(400);

    const revoke = await adminPost(
      new NextRequest('http://localhost/api/admin/properties/prop-1/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', confirm: true }),
      }),
      { params: { propertyId: 'prop-1' } }
    );
    expect(revoke.status).toBe(200);
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.REVOKED,
        actorRole: 'ADMIN',
        actorId: 'admin-1',
      })
    );
  });

  it('unauthorized denied', async () => {
    mocks.requireRole.mockImplementation(async () => {
      throw NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    });
    const res = await adminGet(
      new NextRequest('http://localhost/api/admin/properties/prop-1/guest-access'),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(401);
  });
});
