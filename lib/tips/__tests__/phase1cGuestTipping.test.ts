import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobStatus, ServiceFeedbackSource } from '@prisma/client';
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getCustomerSession: vi.fn(),
  jobFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  tipCreate: vi.fn(),
  tipUpdate: vi.fn(),
  tipUpdateMany: vi.fn(),
  grantFindUnique: vi.fn(),
  grantCreate: vi.fn(),
  grantUpdate: vi.fn(),
  rateCreate: vi.fn(),
  rateUpdateMany: vi.fn(),
  paymentIntentsCreate: vi.fn(),
  propertyFindFirst: vi.fn(),
  jobFindMany: vi.fn(),
  feedbackFindUnique: vi.fn(),
  feedbackCreate: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => mocks.requireRole(...a),
}));

vi.mock('@/lib/customerSession', () => ({
  getCustomerSession: (...a: unknown[]) => mocks.getCustomerSession(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: (...a: unknown[]) => mocks.jobFindUnique(...a),
      findMany: (...a: unknown[]) => mocks.jobFindMany(...a),
    },
    user: { findFirst: (...a: unknown[]) => mocks.userFindFirst(...a) },
    tip: {
      create: (...a: unknown[]) => mocks.tipCreate(...a),
      update: (...a: unknown[]) => mocks.tipUpdate(...a),
      updateMany: (...a: unknown[]) => mocks.tipUpdateMany(...a),
    },
    guestTipAuthorization: {
      findUnique: (...a: unknown[]) => mocks.grantFindUnique(...a),
      create: (...a: unknown[]) => mocks.grantCreate(...a),
      update: (...a: unknown[]) => mocks.grantUpdate(...a),
    },
    apiRateLimitBucket: {
      create: (...a: unknown[]) => mocks.rateCreate(...a),
      updateMany: (...a: unknown[]) => mocks.rateUpdateMany(...a),
    },
    property: {
      findFirst: (...a: unknown[]) => mocks.propertyFindFirst(...a),
    },
    serviceFeedback: {
      findUnique: (...a: unknown[]) => mocks.feedbackFindUnique(...a),
      create: (...a: unknown[]) => mocks.feedbackCreate(...a),
    },
  },
}));

vi.mock('@/lib/tips/references', () => ({
  allocateTipInternalReference: vi.fn(async () => 'VM-TIP-G1'),
}));

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    paymentIntents: {
      create: (...a: unknown[]) => mocks.paymentIntentsCreate(...a),
    },
  }),
}));

vi.mock('@/lib/tips/zelleDestination', () => ({
  getVelocityMaidZelleDestination: () => ({
    label: 'VelocityMaid',
    handle: 'tips@example.com',
    instructions: 'Include the memo.',
  }),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => mocks.logAuditEntry(...a),
}));

import {
  hashGuestTipGrantToken,
  mintGuestTipAuthorization,
  verifyGuestTipGrant,
  GuestTipGrantError,
} from '@/lib/tips/guestTipAuthorization';
import { resolveStayToGuestFeedback } from '@/lib/stay/resolveStay';
import { POST as postStripe } from '@/app/api/tip/create-payment-intent/route';
import { POST as postZelle } from '@/app/api/tip/create-zelle-intent/route';
import { GET as getTipContext } from '@/app/api/tip/context/route';
import { createTipIntent } from '@/lib/tips/createTipIntent';
import { resolveTipServiceEarner } from '@/lib/tips/beneficiary';

const DAY = '2026-10-04';
const DAY_UTC = new Date('2026-10-04T00:00:00.000Z');
const STAY_TOKEN = 'opaque-guest-token-abcdefghijklmnopqrstuvwxyz012345';
const RAW_GRANT = 'guest-grant-token-abcdefghijklmnopqrstuvwxyz0123456789';

function hash(raw: string) {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

function postBody(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/tip/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function activeGrantRow(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function mockCompletedEarner(cleanerId = 'cleaner-1') {
  mocks.jobFindUnique.mockResolvedValue({
    id: 'job-1',
    status: JobStatus.COMPLETED,
    assignedCleanerId: cleanerId,
    propertyId: 'prop-1',
    branchId: 'b1',
    marketLabel: 'vermont',
    completedAt: new Date(),
  });
  mocks.userFindFirst.mockResolvedValue({ id: cleanerId });
}

describe('GuestTipAuthorization hash-at-rest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores hash not raw token on mint', async () => {
    mocks.grantCreate.mockImplementation(async ({ data }: { data: { tokenHash: string } }) => ({
      id: 'g1',
      ...data,
    }));
    const minted = await mintGuestTipAuthorization({
      jobId: 'job-1',
      propertyId: 'prop-1',
    });
    expect(minted.grantToken.length).toBeGreaterThan(40);
    expect(mocks.grantCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: hashGuestTipGrantToken(minted.grantToken),
          jobId: 'job-1',
          propertyId: 'prop-1',
        }),
      })
    );
    const storedHash = mocks.grantCreate.mock.calls[0][0].data.tokenHash;
    expect(storedHash).not.toEqual(minted.grantToken);
    expect(storedHash).toBe(hash(minted.grantToken));
  });

  it('rejects expired / revoked / random grants', async () => {
    mocks.grantFindUnique.mockResolvedValue(null);
    await expect(verifyGuestTipGrant('totally-random-grant-xxxxxxxxxxxx')).rejects.toBeInstanceOf(
      GuestTipGrantError
    );

    mocks.grantFindUnique.mockResolvedValue(
      activeGrantRow({ expiresAt: new Date(Date.now() - 1000) })
    );
    await expect(verifyGuestTipGrant(RAW_GRANT)).rejects.toMatchObject({
      code: 'GRANT_EXPIRED',
    });

    mocks.grantFindUnique.mockResolvedValue(
      activeGrantRow({ revokedAt: new Date() })
    );
    await expect(verifyGuestTipGrant(RAW_GRANT)).rejects.toMatchObject({
      code: 'INVALID_GRANT',
    });
  });

  it('rejects grant when job not COMPLETED or archived', async () => {
    mocks.grantFindUnique.mockResolvedValue(
      activeGrantRow({
        Job: {
          id: 'job-1',
          status: JobStatus.ASSIGNED,
          archivedAt: null,
          propertyId: 'prop-1',
        },
      })
    );
    await expect(verifyGuestTipGrant(RAW_GRANT)).rejects.toMatchObject({
      code: 'JOB_NOT_ELIGIBLE',
    });
  });
});

describe('Stay resolve mints tip grant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
    mocks.grantCreate.mockResolvedValue({ id: 'grant-1' });
  });

  it('exact stay returns tipGrantToken without Job.id', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: 'Birch',
      guestAccessToken: STAY_TOKEN,
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
    mocks.feedbackFindUnique.mockResolvedValue(null);
    mocks.feedbackCreate.mockResolvedValue({
      publicToken: 'fb-tok',
      id: 'fb1',
      source: ServiceFeedbackSource.GUEST,
    });

    const result = await resolveStayToGuestFeedback(STAY_TOKEN, DAY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tipGrantToken).toBeTruthy();
      expect(result.feedbackToken).toBe('fb-tok');
      expect(JSON.stringify(result)).not.toMatch(/job-1|cust-1/);
    }
  });

  it('ambiguous stay does not mint grant', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: null,
      guestAccessToken: STAY_TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-a', preferredDate: DAY_UTC },
      { id: 'job-b', preferredDate: DAY_UTC },
    ]);
    const result = await resolveStayToGuestFeedback(STAY_TOKEN, DAY);
    expect(result).toMatchObject({ ok: false, code: 'AMBIGUOUS' });
    expect(mocks.grantCreate).not.toHaveBeenCalled();
  });
});

describe('Guest tip context privacy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('grant context omits jobReference and street/address', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mockCompletedEarner();
    // getGuestTipDisplayContext second load
    mocks.jobFindUnique
      .mockResolvedValueOnce({
        id: 'job-1',
        status: JobStatus.COMPLETED,
        assignedCleanerId: 'cleaner-1',
        propertyId: 'prop-1',
        branchId: 'b1',
        marketLabel: null,
        completedAt: new Date(),
      })
      .mockResolvedValueOnce({
        status: JobStatus.COMPLETED,
        preferredDate: DAY_UTC,
        serviceType: 'Turnover',
        Property: {
          guestDisplayName: 'Birch Cabin',
        },
      });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });

    const res = await getTipContext(
      new NextRequest(
        `http://localhost/api/tip/context?grant=${encodeURIComponent(RAW_GRANT)}`
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authMode).toBe('GUEST_GRANT');
    expect(body.context.propertyLabel).toBe('Birch Cabin');
    expect(body.context.jobReference).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/job-1|Thomson|email|phone|invoice/i);
  });
});

describe('Guest tip create dual-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateCreate.mockResolvedValue({ id: 'r1' });
    mocks.tipCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'tip-g',
      ...data,
    }));
    mocks.grantUpdate.mockResolvedValue({});
  });

  it('guest Stripe intent via grant freezes beneficiary at create time', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-dorottya',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: 'vermont',
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-dorottya' });
    mocks.paymentIntentsCreate.mockResolvedValue({
      id: 'pi_g',
      client_secret: 'sec_g',
    });
    mocks.tipUpdate.mockResolvedValue({});

    const res = await postStripe(
      postBody({ grantToken: RAW_GRANT, amount: 20 })
    );
    expect(res.status).toBe(200);
    const created = mocks.tipCreate.mock.calls[0][0].data;
    expect(created.beneficiaryCleanerId).toBe('cleaner-dorottya');
    expect(created.jobId).toBe('job-1');
    expect(mocks.grantUpdate).toHaveBeenCalled(); // useCount touch after PI
    expect(mocks.requireRole).not.toHaveBeenCalled();
    expect(mocks.tipUpdateMany).not.toHaveBeenCalled();
  });

  it('Stripe create succeeds: attaches PI then records grant use', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });
    mocks.paymentIntentsCreate.mockResolvedValue({
      id: 'pi_ok',
      client_secret: 'sec_ok',
    });
    mocks.tipUpdate.mockResolvedValue({});

    const res = await postStripe(postBody({ grantToken: RAW_GRANT, amount: 20 }));
    expect(res.status).toBe(200);
    expect(mocks.tipCreate).toHaveBeenCalledTimes(1);
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledTimes(1);
    expect(mocks.tipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tip-g' },
        data: { stripePaymentIntentId: 'pi_ok' },
      })
    );
    expect(mocks.grantUpdate).toHaveBeenCalledTimes(1);
    // grant touch after tip PI attach (call order)
    const tipUpdateOrder = mocks.tipUpdate.mock.invocationCallOrder[0]!;
    const grantOrder = mocks.grantUpdate.mock.invocationCallOrder[0]!;
    expect(tipUpdateOrder).toBeLessThan(grantOrder);
  });

  it('Stripe create throws: abandons PENDING tip and does not touch grant', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });
    mocks.paymentIntentsCreate.mockRejectedValue(new Error('stripe_down'));
    mocks.tipUpdateMany.mockResolvedValue({ count: 1 });

    const res = await postStripe(postBody({ grantToken: RAW_GRANT, amount: 20 }));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe('STRIPE_CREATE_FAILED');
    expect(mocks.tipCreate).toHaveBeenCalledTimes(1);
    expect(mocks.tipUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'tip-g',
          status: 'PENDING',
          stripePaymentIntentId: null,
          paymentMethod: 'STRIPE',
        }),
        data: { status: 'FAILED' },
      })
    );
    expect(mocks.grantUpdate).not.toHaveBeenCalled();
    expect(mocks.tipUpdate).not.toHaveBeenCalled();
  });

  it('retry after Stripe throw yields one usable Tip/PI pair; failed tip not PENDING', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });

    let tipSeq = 0;
    mocks.tipCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      tipSeq += 1;
      return { id: `tip-retry-${tipSeq}`, ...data };
    });

    mocks.paymentIntentsCreate
      .mockRejectedValueOnce(new Error('stripe_down'))
      .mockResolvedValueOnce({ id: 'pi_retry', client_secret: 'sec_retry' });
    mocks.tipUpdateMany.mockResolvedValue({ count: 1 });
    mocks.tipUpdate.mockResolvedValue({});

    const fail = await postStripe(postBody({ grantToken: RAW_GRANT, amount: 20 }));
    expect(fail.status).toBe(500);
    expect(mocks.grantUpdate).not.toHaveBeenCalled();
    expect(mocks.tipUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'tip-retry-1' }),
        data: { status: 'FAILED' },
      })
    );

    const ok = await postStripe(postBody({ grantToken: RAW_GRANT, amount: 20 }));
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.tipId).toBe('tip-retry-2');
    expect(body.clientSecret).toBe('sec_retry');
    expect(mocks.tipCreate).toHaveBeenCalledTimes(2);
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledTimes(2);
    expect(mocks.grantUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.tipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tip-retry-2' },
        data: { stripePaymentIntentId: 'pi_retry' },
      })
    );
  });

  it('guest Zelle intent via grant works without CUSTOMER session', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });

    const res = await postZelle(postBody({ grantToken: RAW_GRANT, amount: 15 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paymentMethod).toBe('ZELLE');
    expect(body.guestCanConfirm).toBe(false);
  });

  it('guest cannot override jobId or cleaner with grant', async () => {
    const res = await postStripe(
      postBody({
        grantToken: RAW_GRANT,
        jobId: 'attacker-job',
        amount: 20,
        cleanerId: 'evil',
      })
    );
    // cleaner rejected first
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('FORBIDDEN_FIELD');
  });

  it('guest cannot send jobId+grant together', async () => {
    const res = await postStripe(
      postBody({ grantToken: RAW_GRANT, jobId: 'job-1', amount: 20 })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('AMBIGUOUS_AUTH');
  });

  it('random grant rejected', async () => {
    mocks.grantFindUnique.mockResolvedValue(null);
    const res = await postStripe(
      postBody({ grantToken: 'not-a-real-grant-xxxxxxxxxxxxxxx', amount: 20 })
    );
    expect(res.status).toBe(404);
    expect(mocks.tipCreate).not.toHaveBeenCalled();
  });

  it('multiple tips allowed on same grant (not single-use)', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });

    const r1 = await postZelle(postBody({ grantToken: RAW_GRANT, amount: 10 }));
    const r2 = await postZelle(postBody({ grantToken: RAW_GRANT, amount: 12 }));
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(mocks.tipCreate).toHaveBeenCalledTimes(2);
  });

  it('beneficiary uses assignee at tip-intent create, not earlier grant time', async () => {
    // simulate reassignment: earner resolve sees cleaner-B
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-B',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-B' });
    mocks.tipCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'tip-re',
      ...data,
    }));

    const intent = await createTipIntent({
      jobId: 'job-1',
      amountCents: 2000,
      paymentMethod: 'ZELLE',
    });
    expect(intent.beneficiaryCleanerId).toBe('cleaner-B');

    // reassignment again
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-C',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-C' });
    const earner = await resolveTipServiceEarner('job-1');
    expect(earner.beneficiaryCleanerId).toBe('cleaner-C');
  });

  it('no eligible cleaner → 409', async () => {
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: null,
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });

    const res = await postZelle(postBody({ grantToken: RAW_GRANT, amount: 10 }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('NO_SERVICE_EARNER');
  });

  it('host CUSTOMER path still works without grant', async () => {
    mocks.requireRole.mockResolvedValue({ userId: 'cust-1', role: 'CUSTOMER' });
    mocks.getCustomerSession.mockResolvedValue({
      customerId: 'cust-1',
      email: 'h@example.com',
    });
    mocks.jobFindUnique
      .mockResolvedValueOnce({ id: 'job-1', customerId: 'cust-1' })
      .mockResolvedValueOnce({
        id: 'job-1',
        status: JobStatus.COMPLETED,
        assignedCleanerId: 'cleaner-1',
        propertyId: 'prop-1',
        branchId: 'b1',
        marketLabel: null,
        completedAt: new Date(),
      });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });

    const res = await postZelle(postBody({ jobId: 'job-1', amount: 20 }));
    expect(res.status).toBe(200);
    expect(mocks.grantUpdate).not.toHaveBeenCalled();
  });

  it('tip eligibility is independent of feedback submit (rating never gates tip)', async () => {
    // Grant verifies job eligibility only — no ServiceFeedback read on tip create
    mocks.grantFindUnique.mockResolvedValue(activeGrantRow());
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
      branchId: 'b1',
      marketLabel: null,
      completedAt: new Date(),
    });
    mocks.userFindFirst.mockResolvedValue({ id: 'cleaner-1' });

    const res = await postZelle(postBody({ grantToken: RAW_GRANT, amount: 18 }));
    expect(res.status).toBe(200);
    expect(mocks.feedbackFindUnique).not.toHaveBeenCalled();
    expect(mocks.feedbackCreate).not.toHaveBeenCalled();
  });

  it('expired grant returns 410', async () => {
    mocks.grantFindUnique.mockResolvedValue(
      activeGrantRow({ expiresAt: new Date(Date.now() - 5000) })
    );
    const res = await postZelle(postBody({ grantToken: RAW_GRANT, amount: 10 }));
    expect(res.status).toBe(410);
    expect((await res.json()).code).toBe('GRANT_EXPIRED');
  });
});
