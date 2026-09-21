/**
 * Guest-access CUSTOMER audit integrity — AuditLog.actorId is User FK.
 * CUSTOMER identity must live in changes.customerId, not actorId.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getCustomerSession: vi.fn(),
  loadOwnedProperty: vi.fn(),
  propertyFindUnique: vi.fn(),
  propertyFindFirst: vi.fn(),
  propertyFindMany: vi.fn(),
  propertyUpdate: vi.fn(),
  propertyUpdateMany: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => mocks.getCustomerSession(...a),
}));

vi.mock('@/lib/properties/propertyService', () => ({
  loadOwnedProperty: (...a: unknown[]) => mocks.loadOwnedProperty(...a),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => mocks.logAuditEntry(...a),
}));

vi.mock('@/lib/prisma', () => {
  const prisma = {
    property: {
      findUnique: (...a: unknown[]) => mocks.propertyFindUnique(...a),
      findFirst: (...a: unknown[]) => mocks.propertyFindFirst(...a),
      findMany: (...a: unknown[]) => mocks.propertyFindMany(...a),
      update: (...a: unknown[]) => mocks.propertyUpdate(...a),
      updateMany: (...a: unknown[]) => mocks.propertyUpdateMany(...a),
    },
    $transaction: async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
  };
  return { prisma };
});

import { POST as customerPost } from '@/app/api/customer/properties/[propertyId]/guest-access/route';
import {
  GUEST_ACCESS_AUDIT,
  buildGuestAccessAuditChanges,
  ensurePropertyGuestAccessToken,
  resolveGuestAccessAuditActorId,
  rotatePropertyGuestAccessToken,
  revokePropertyGuestAccessToken,
} from '@/lib/stay/propertyGuestAccess';

const TOKEN = 'opaque-guest-token-abcdefghijklmnopqrstuvwxyz012345';
const CUSTOMER_ID = 'cust-chipman-1';
const ADMIN_USER_ID = 'admin-user-1';

function activeRow(overrides: Record<string, unknown> = {}) {
  return {
    guestAccessToken: TOKEN,
    guestAccessTokenCreatedAt: new Date('2026-09-01T00:00:00.000Z'),
    guestAccessRevokedAt: null,
    guestDisplayName: 'Chipman Park Stay',
    Customer: { archivedAt: null },
    ...overrides,
  };
}

describe('resolveGuestAccessAuditActorId / changes builder', () => {
  it('CUSTOMER never puts customerId into actorId', () => {
    expect(
      resolveGuestAccessAuditActorId({
        actorRole: 'CUSTOMER',
        customerId: CUSTOMER_ID,
        actorId: CUSTOMER_ID, // even if mistakenly set
      })
    ).toBeNull();
  });

  it('ADMIN keeps User.id as actorId', () => {
    expect(
      resolveGuestAccessAuditActorId({
        actorRole: 'ADMIN',
        actorId: ADMIN_USER_ID,
      })
    ).toBe(ADMIN_USER_ID);
  });

  it('CUSTOMER metadata includes customerId without token/stayUrl', () => {
    const changes = buildGuestAccessAuditChanges(
      'prop-1',
      {
        actorRole: 'CUSTOMER',
        customerId: CUSTOMER_ID,
      },
      { created: true }
    );
    expect(changes).toEqual({
      propertyId: 'prop-1',
      created: true,
      customerId: CUSTOMER_ID,
    });
    expect(JSON.stringify(changes)).not.toMatch(/guestAccessToken|stayUrl/);
  });
});

describe('CUSTOMER guest-access audit persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCustomerSession.mockResolvedValue({ customerId: CUSTOMER_ID });
    mocks.loadOwnedProperty.mockResolvedValue({ id: 'prop-1' });
    mocks.logAuditEntry.mockResolvedValue('audit-ok');
    mocks.propertyUpdate.mockResolvedValue({});
  });

  it('ensure: activation succeeds; audit persists with CUSTOMER identity metadata', async () => {
    mocks.propertyFindUnique.mockResolvedValue(
      activeRow({ guestAccessToken: null })
    );
    const res = await customerPost(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ensure',
            guestDisplayName: 'Chipman Park Stay',
          }),
        }
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.qrReady).toBe(true);

    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.ENSURED,
        actorRole: 'CUSTOMER',
        actorId: null,
        entityType: 'Property',
        entityId: 'prop-1',
        changes: expect.objectContaining({
          propertyId: 'prop-1',
          customerId: CUSTOMER_ID,
          created: true,
        }),
      })
    );
    const payload = JSON.stringify(mocks.logAuditEntry.mock.calls[0][0]);
    expect(payload).not.toContain(TOKEN);
    expect(payload).not.toMatch(/guestAccessToken/);
    expect(payload).not.toMatch(/stayUrl/);
  });

  it('rotate: same audit identity behavior; no raw token', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activeRow());
    const res = await customerPost(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rotate',
            guestDisplayName: 'Chipman Park Stay',
            confirm: true,
          }),
        }
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.ROTATED,
        actorRole: 'CUSTOMER',
        actorId: null,
        changes: expect.objectContaining({
          customerId: CUSTOMER_ID,
          confirmed: true,
        }),
      })
    );
    expect(JSON.stringify(mocks.logAuditEntry.mock.calls[0][0])).not.toContain(
      TOKEN
    );
  });

  it('revoke: same audit identity behavior; no raw token', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activeRow());
    const res = await customerPost(
      new NextRequest(
        'http://localhost/api/customer/properties/prop-1/guest-access',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'revoke', confirm: true }),
        }
      ),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.REVOKED,
        actorRole: 'CUSTOMER',
        actorId: null,
        changes: expect.objectContaining({
          customerId: CUSTOMER_ID,
          confirmed: true,
        }),
      })
    );
    expect(JSON.stringify(mocks.logAuditEntry.mock.calls[0][0])).not.toContain(
      TOKEN
    );
  });
});

describe('audit persistence failure is observable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue(null);
    mocks.propertyUpdate.mockResolvedValue({});
    mocks.propertyFindUnique.mockResolvedValue(
      activeRow({ guestAccessToken: null })
    );
  });

  it('ensure still succeeds; GUEST_ACCESS_AUDIT_PERSIST_FAILED is logged', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await ensurePropertyGuestAccessToken(
      'prop-1',
      { actorRole: 'CUSTOMER', customerId: CUSTOMER_ID },
      { guestDisplayName: 'Chipman Park Stay' }
    );
    expect(result.created).toBe(true);
    expect(result.qrReady).toBe(true);
    expect(errSpy).toHaveBeenCalledWith(
      '[GUEST_ACCESS_AUDIT_PERSIST_FAILED]',
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.ENSURED,
        propertyId: 'prop-1',
        actorRole: 'CUSTOMER',
        customerId: CUSTOMER_ID,
      })
    );
    errSpy.mockRestore();
  });

  it('rotate still succeeds; persist failure remains visible', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activeRow());
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await rotatePropertyGuestAccessToken(
      'prop-1',
      { actorRole: 'ADMIN', actorId: ADMIN_USER_ID },
      { confirmed: true, guestDisplayName: 'Chipman Park Stay' }
    );
    expect(errSpy).toHaveBeenCalledWith(
      '[GUEST_ACCESS_AUDIT_PERSIST_FAILED]',
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.ROTATED,
        actorRole: 'ADMIN',
        adminActorId: ADMIN_USER_ID,
      })
    );
    errSpy.mockRestore();
  });

  it('revoke still succeeds; persist failure remains visible', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activeRow());
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await revokePropertyGuestAccessToken(
      'prop-1',
      { actorRole: 'CUSTOMER', customerId: CUSTOMER_ID },
      { confirmed: true }
    );
    expect(errSpy).toHaveBeenCalledWith(
      '[GUEST_ACCESS_AUDIT_PERSIST_FAILED]',
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.REVOKED,
        actorRole: 'CUSTOMER',
      })
    );
    errSpy.mockRestore();
  });
});
