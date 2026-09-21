/**
 * Phase 1D-A — Property QR Safety Controls
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { JobStatus, ServiceFeedbackSource, ServiceFeedbackStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  getCustomerSession: vi.fn(),
  loadOwnedProperty: vi.fn(),
  requireRole: vi.fn(),
  propertyFindUnique: vi.fn(),
  propertyFindFirst: vi.fn(),
  propertyFindMany: vi.fn(),
  propertyUpdate: vi.fn(),
  propertyUpdateMany: vi.fn(),
  customerFindUnique: vi.fn(),
  customerUpdate: vi.fn(),
  jobFindMany: vi.fn(),
  jobFindUnique: vi.fn(),
  feedbackFindUnique: vi.fn(),
  feedbackCreate: vi.fn(),
  feedbackUpdateMany: vi.fn(),
  grantFindMany: vi.fn(),
  grantFindFirst: vi.fn(),
  grantCreate: vi.fn(),
  grantFindUnique: vi.fn(),
  grantUpdate: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => mocks.getCustomerSession(...a),
}));

vi.mock('@/lib/properties/propertyService', () => ({
  loadOwnedProperty: (...a: unknown[]) => mocks.loadOwnedProperty(...a),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
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
    customer: {
      findUnique: (...a: unknown[]) => mocks.customerFindUnique(...a),
      update: (...a: unknown[]) => mocks.customerUpdate(...a),
    },
    job: {
      findMany: (...a: unknown[]) => mocks.jobFindMany(...a),
      findUnique: (...a: unknown[]) => mocks.jobFindUnique(...a),
    },
    serviceFeedback: {
      findUnique: (...a: unknown[]) => mocks.feedbackFindUnique(...a),
      create: (...a: unknown[]) => mocks.feedbackCreate(...a),
      updateMany: (...a: unknown[]) => mocks.feedbackUpdateMany(...a),
    },
    guestTipAuthorization: {
      findMany: (...a: unknown[]) => mocks.grantFindMany(...a),
      findFirst: (...a: unknown[]) => mocks.grantFindFirst(...a),
      create: (...a: unknown[]) => mocks.grantCreate(...a),
      findUnique: (...a: unknown[]) => mocks.grantFindUnique(...a),
      update: (...a: unknown[]) => mocks.grantUpdate(...a),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
    $transaction: async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
  };
  return { prisma };
});

import {
  GET as customerGet,
  POST as customerPost,
} from '@/app/api/customer/properties/[propertyId]/guest-access/route';
import {
  GUEST_ACCESS_AUDIT,
  PRINTED_CARD_WARNING,
  ensurePropertyGuestAccessToken,
  findActivePropertyByGuestToken,
  revokePropertyGuestAccessToken,
  rotatePropertyGuestAccessToken,
} from '@/lib/stay/propertyGuestAccess';
import { archiveCustomer } from '@/lib/admin/customerLifecycle';
import { mintGuestTipAuthorization } from '@/lib/tips/guestTipAuthorization';
import { resolveStayToGuestFeedback } from '@/lib/stay/resolveStay';
import { getPublicFeedbackByToken, submitPublicFeedback } from '@/lib/feedback/serviceFeedback';
import { readFileSync } from 'fs';
import { join } from 'path';

const DAY = '2026-10-04';
const DAY_UTC = new Date('2026-10-04T00:00:00.000Z');
const TOKEN = 'opaque-guest-token-abcdefghijklmnopqrstuvwxyz012345';

function activePropertyRow(overrides: Record<string, unknown> = {}) {
  return {
    guestAccessToken: TOKEN,
    guestAccessTokenCreatedAt: new Date('2026-09-01T00:00:00.000Z'),
    guestAccessRevokedAt: null,
    guestDisplayName: 'Birch Cabin',
    Customer: { archivedAt: null },
    ...overrides,
  };
}

describe('CUSTOMER guest-access authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
    mocks.getCustomerSession.mockResolvedValue({ customerId: 'cust-1' });
    mocks.loadOwnedProperty.mockResolvedValue({ id: 'prop-1' });
    mocks.propertyUpdate.mockResolvedValue({});
  });

  it('owner can ensure when display name set', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activePropertyRow({ guestAccessToken: null }));
    const res = await customerPost(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ensure',
          guestDisplayName: 'Birch Cabin',
        }),
      }),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.stayUrl).toMatch(/\/stay\//);
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.ENSURED,
        actorRole: 'CUSTOMER',
        actorId: null,
        entityId: 'prop-1',
        changes: expect.objectContaining({
          customerId: 'cust-1',
        }),
      })
    );
    const auditPayload = JSON.stringify(mocks.logAuditEntry.mock.calls[0][0]);
    expect(auditPayload).not.toMatch(TOKEN);
    expect(auditPayload).not.toMatch(/guestAccessToken":"[^"]{20,}/);
  });

  it('cross-property denied (not owned)', async () => {
    mocks.loadOwnedProperty.mockResolvedValue(null);
    const res = await customerPost(
      new NextRequest('http://localhost/api/customer/properties/prop-other/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensure', guestDisplayName: 'X' }),
      }),
      { params: { propertyId: 'prop-other' } }
    );
    expect(res.status).toBe(404);
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
  });

  it('unauthorized without session', async () => {
    mocks.getCustomerSession.mockResolvedValue(null);
    const res = await customerGet(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access'),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(401);
  });

  it('GET remains read-only', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activePropertyRow());
    const res = await customerGet(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access'),
      { params: { propertyId: 'prop-1' } }
    );
    const body = await res.json();
    expect(body.active).toBe(true);
    expect(body.qrReady).toBe(true);
    expect(body).not.toHaveProperty('token');
    expect(body).not.toHaveProperty('guestAccessToken');
    // stayUrl may embed the opaque path segment; never return a dedicated raw-token field
    expect(body.stayUrl).toMatch(/\/stay\//);
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
  });

  it('rotate/revoke require confirm', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activePropertyRow());
    const rotate = await customerPost(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate', guestDisplayName: 'Birch Cabin' }),
      }),
      { params: { propertyId: 'prop-1' } }
    );
    expect(rotate.status).toBe(400);
    expect((await rotate.json()).error).toContain(PRINTED_CARD_WARNING.slice(0, 40));
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();

    const revoke = await customerPost(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      }),
      { params: { propertyId: 'prop-1' } }
    );
    expect(revoke.status).toBe(400);
  });

  it('confirmed rotate audits without raw token', async () => {
    mocks.propertyFindUnique.mockResolvedValue(activePropertyRow());
    const res = await customerPost(
      new NextRequest('http://localhost/api/customer/properties/prop-1/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rotate',
          confirm: true,
          guestDisplayName: 'Birch Cabin',
        }),
      }),
      { params: { propertyId: 'prop-1' } }
    );
    expect(res.status).toBe(200);
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.ROTATED,
        actorRole: 'CUSTOMER',
        actorId: null,
        changes: expect.objectContaining({
          customerId: 'cust-1',
        }),
      })
    );
    expect(JSON.stringify(mocks.logAuditEntry.mock.calls)).not.toContain(TOKEN);
  });
});

describe('ADMIN emergency revoke (lib)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
    mocks.propertyUpdate.mockResolvedValue({});
  });

  it('ADMIN actor can revoke without customer session', async () => {
    mocks.propertyFindUnique.mockResolvedValue({ id: 'prop-1' });
    await revokePropertyGuestAccessToken(
      'prop-1',
      { actorRole: 'ADMIN', actorId: 'admin-1' },
      { confirmed: true }
    );
    expect(mocks.propertyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { guestAccessRevokedAt: expect.any(Date) },
      })
    );
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.REVOKED,
        actorRole: 'ADMIN',
        actorId: 'admin-1',
      })
    );
    expect(JSON.stringify(mocks.logAuditEntry.mock.calls)).not.toContain(TOKEN);
  });
});

describe('Archive revokes guest doorways', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
  });

  it('archiveCustomer revokes active property tokens', async () => {
    mocks.customerFindUnique.mockResolvedValue({
      id: 'cust-1',
      email: 'h@example.com',
      archivedAt: null,
    });
    mocks.customerUpdate.mockResolvedValue({
      id: 'cust-1',
      email: 'h@example.com',
      archivedAt: new Date(),
      archivedBy: 'ADMIN',
      recordKind: 'STANDARD',
    });
    mocks.propertyFindMany.mockResolvedValue([{ id: 'prop-1' }, { id: 'prop-2' }]);
    mocks.propertyUpdateMany.mockResolvedValue({ count: 2 });

    await archiveCustomer({ customerId: 'cust-1', actorId: 'admin-1' });

    expect(mocks.propertyUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { guestAccessRevokedAt: expect.any(Date) },
      })
    );
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: GUEST_ACCESS_AUDIT.REVOKED,
        entityId: 'prop-1',
        changes: expect.objectContaining({ reason: 'CUSTOMER_ARCHIVE' }),
      })
    );
  });

  it('archived owner cannot resolve stay', async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);
    const found = await findActivePropertyByGuestToken(TOKEN);
    expect(found).toBeNull();

    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result).toMatchObject({ ok: false, code: 'INVALID_TOKEN' });
  });

  it('revoke immediately stops property-token resolution', async () => {
    mocks.propertyFindUnique.mockResolvedValue({ id: 'prop-1' });
    mocks.propertyUpdate.mockResolvedValue({});
    await revokePropertyGuestAccessToken('prop-1', { actorRole: 'ADMIN', actorId: 'a1' }, {
      confirmed: true,
    });
    mocks.propertyFindFirst.mockResolvedValue(null);
    expect(await findActivePropertyByGuestToken(TOKEN)).toBeNull();
  });
});

describe('Bounded tip-grant mint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.grantFindMany.mockResolvedValue([]);
    mocks.grantFindFirst.mockResolvedValue(null);
    mocks.grantUpdate.mockResolvedValue({});
    mocks.grantCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'g-new',
      ...data,
    }));
  });

  it('repeated correct-date resolve remints tip URL (replaceActive)', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: 'Birch',
      guestAccessToken: TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([{ id: 'job-1', preferredDate: DAY_UTC }]);
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      archivedAt: null,
      customerId: 'cust-1',
      assignedCleanerId: 'c1',
      propertyId: 'prop-1',
    });
    mocks.feedbackFindUnique.mockResolvedValue({
      publicToken: 'fb-tok',
      id: 'fb1',
      source: ServiceFeedbackSource.GUEST,
    });
    mocks.grantFindFirst.mockResolvedValue({ id: 'grant-existing' });
    mocks.grantFindMany.mockResolvedValue([
      { id: 'grant-existing', expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ]);
    mocks.grantUpdate.mockResolvedValue({});
    mocks.grantCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'g-reissued',
      ...data,
    }));

    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tipGrantStatus).toBe('REISSUED');
      expect(result.tipGrantToken).toBeTruthy();
      expect(result.tipUrl).toMatch(/\/tip\?grant=/);
      expect(result.feedbackToken).toBe('fb-tok');
    }
    expect(mocks.grantUpdate).toHaveBeenCalled();
    expect(mocks.grantCreate).toHaveBeenCalled();
  });

  it('first mint succeeds; second mint bound while active', async () => {
    const first = await mintGuestTipAuthorization({
      jobId: 'job-1',
      propertyId: 'prop-1',
    });
    expect(first.status).toBe('MINTED');

    mocks.grantFindMany.mockResolvedValue([
      { id: 'g-new', expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    ]);
    const second = await mintGuestTipAuthorization({
      jobId: 'job-1',
      propertyId: 'prop-1',
    });
    expect(second.status).toBe('ALREADY_ACTIVE');
    expect(mocks.grantCreate).toHaveBeenCalledTimes(1);
  });

  it('active grant verify remains reusable for multi-tip (does not consume)', async () => {
    const { verifyGuestTipGrant } = await import('@/lib/tips/guestTipAuthorization');
    const RAW = 'guest-grant-token-abcdefghijklmnopqrstuvwxyz0123456789';
    mocks.grantFindUnique.mockResolvedValue({
      id: 'grant-1',
      jobId: 'job-1',
      propertyId: 'prop-1',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      revokedAt: null,
      Property: { guestAccessRevokedAt: null },
      Job: {
        id: 'job-1',
        status: JobStatus.COMPLETED,
        archivedAt: null,
        propertyId: 'prop-1',
      },
    });
    const a = await verifyGuestTipGrant(RAW);
    const b = await verifyGuestTipGrant(RAW);
    expect(a.grantId).toBe('grant-1');
    expect(b.grantId).toBe('grant-1');
    expect(mocks.grantFindUnique).toHaveBeenCalledTimes(2);
  });
});

describe('Feedback after property revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
  });

  it('previously issued GUEST feedback token still loads and submits', async () => {
    mocks.feedbackFindUnique.mockResolvedValue({
      id: 'fb1',
      publicToken: 'fb-public-token',
      status: ServiceFeedbackStatus.REQUESTED,
      source: ServiceFeedbackSource.GUEST,
      submittedAt: null,
      Job: {
        preferredDate: DAY_UTC,
        address: '123 Secret St',
        Property: {
          name: 'Owner Label',
          address: '123 Secret St',
          guestDisplayName: 'Birch',
        },
      },
    });

    const view = await getPublicFeedbackByToken('fb-public-token');
    expect(view.state).toBe('ready');
    if (view.state === 'ready') {
      expect(view.propertyLabel).toBe('Birch');
      expect(view.propertyLabel).not.toMatch(/Secret/);
    }

    mocks.feedbackFindUnique.mockResolvedValue({
      id: 'fb1',
      publicToken: 'fb-public-token',
      status: ServiceFeedbackStatus.REQUESTED,
      submittedAt: null,
      source: ServiceFeedbackSource.GUEST,
    });
    mocks.feedbackUpdateMany.mockResolvedValue({ count: 1 });

    const submitted = await submitPublicFeedback('fb-public-token', {
      overallRating: 5,
      cleanlinessRating: 5,
      communicationRating: 5,
      timelinessRating: 5,
      comment: 'Great stay clean',
    });
    expect(submitted).toEqual(
      expect.objectContaining({ ok: true, alreadySubmitted: false })
    );
  });

  it('feedback submit path does not consult property guest-access revoke state', () => {
    const src = readFileSync(
      join(process.cwd(), 'lib/feedback/serviceFeedback.ts'),
      'utf8'
    );
    const submitFn = src.slice(
      src.indexOf('export async function submitPublicFeedback'),
      src.indexOf('export async function listServiceFeedbackForAdmin')
    );
    expect(submitFn).not.toMatch(/guestAccessRevokedAt|guestAccessToken/);
  });
});

describe('Guest tip success UX', () => {
  it('guest tip success page has no My Jobs framing', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/tip/success/page.tsx'),
      'utf8'
    );
    expect(src).toMatch(/mode === ["']guest["']/);
    expect(src).toMatch(/Back to VelocityMaid/);
    const guestArmMatch = src.match(
      /\{isGuest \? \(\s*<Link[\s\S]*?<\/Link>\s*\) : \(/
    );
    expect(guestArmMatch?.[0] ?? '').toMatch(/Back to VelocityMaid/);
    expect(guestArmMatch?.[0] ?? '').not.toMatch(/My Jobs/);
  });

  it('TipFlow guest context errors omit My Jobs CTA', () => {
    const src = readFileSync(
      join(process.cwd(), 'components/tip/TipFlow.tsx'),
      'utf8'
    );
    expect(src).toMatch(/authMode === 'CUSTOMER'/);
    expect(src).toMatch(/guestMode=\{authMode === 'GUEST_GRANT'\}/);
  });
});

describe('guestDisplayName gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
    mocks.propertyUpdate.mockResolvedValue({});
  });

  it('ensure without display name fails', async () => {
    mocks.propertyFindUnique.mockResolvedValue(
      activePropertyRow({ guestAccessToken: null, guestDisplayName: null })
    );
    await expect(
      ensurePropertyGuestAccessToken('prop-1', {
        actorRole: 'CUSTOMER',
        customerId: 'c1',
      })
    ).rejects.toThrow(/display name/i);
  });

  it('rotate requires display name + confirm', async () => {
    mocks.propertyFindUnique.mockResolvedValue(
      activePropertyRow({ guestDisplayName: null })
    );
    await expect(
      rotatePropertyGuestAccessToken(
        'prop-1',
        { actorRole: 'ADMIN', actorId: 'a1' },
        { confirmed: true }
      )
    ).rejects.toThrow(/display name/i);
  });
});
