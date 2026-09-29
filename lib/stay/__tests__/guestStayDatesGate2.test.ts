/**
 * Gate 2 — structured guest stay dates on Stay resolve.
 * preferredDate remains service/turnover; guestCheckOutDate is primary match.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobStatus, ServiceFeedbackSource } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  propertyFindFirst: vi.fn(),
  jobFindMany: vi.fn(),
  jobFindUnique: vi.fn(),
  feedbackFindUnique: vi.fn(),
  feedbackCreate: vi.fn(),
  grantFindMany: vi.fn(),
  grantFindFirst: vi.fn(),
  grantCreate: vi.fn(),
  grantUpdate: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const prisma = {
    property: { findFirst: mocks.propertyFindFirst },
    job: {
      findMany: mocks.jobFindMany,
      findUnique: mocks.jobFindUnique,
    },
    serviceFeedback: {
      findUnique: mocks.feedbackFindUnique,
      create: mocks.feedbackCreate,
    },
    guestTipAuthorization: {
      findMany: mocks.grantFindMany,
      findFirst: mocks.grantFindFirst,
      create: mocks.grantCreate,
      update: mocks.grantUpdate,
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
    $transaction: async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
  };
  return { prisma };
});

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => mocks.logAuditEntry(...a),
}));

import {
  findCompletedJobsForStayDay,
  findSingleRecentEligibleStay,
  resolveStayToGuestFeedback,
  STAY_RESOLVE_MODE_SINGLE_RECENT,
  stayIdentityDayKey,
} from '@/lib/stay/resolveStay';

const TOKEN = 'opaqueGate2Tokenabcdefghijklmnopqrstuvwxyz0123456789ab';
const PROP = 'prop-bear-hill';

const CHECKOUT = '2026-09-30';
const SERVICE = '2026-10-01';
const CHECKIN_UTC = new Date('2026-09-28T00:00:00.000Z');
const CHECKOUT_UTC = new Date('2026-09-30T00:00:00.000Z');
const SERVICE_UTC = new Date('2026-10-01T00:00:00.000Z');
const SAME_DAY_UTC = new Date('2026-10-02T00:00:00.000Z');
const AFTER_CHECKOUT_SERVICE = new Date('2026-10-03T00:00:00.000Z');
const AFTER_CHECKOUT = new Date('2026-10-02T00:00:00.000Z');

function mockProperty() {
  mocks.propertyFindFirst.mockResolvedValue({
    id: PROP,
    guestDisplayName: 'Bear Hill',
    guestAccessToken: TOKEN,
  });
}

function mockFeedbackAndTip(jobId: string) {
  mocks.jobFindUnique.mockResolvedValue({
    id: jobId,
    status: JobStatus.COMPLETED,
    archivedAt: null,
    customerId: 'cust-1',
    assignedCleanerId: 'cleaner-1',
    propertyId: PROP,
  });
  mocks.feedbackFindUnique.mockResolvedValue(null);
  mocks.feedbackCreate.mockResolvedValue({
    id: `fb-${jobId}`,
    publicToken: `guest-fb-${jobId.replace(/^job-/, 'tok-')}`,
    jobId,
    source: ServiceFeedbackSource.GUEST,
    status: 'REQUESTED',
  });
  mocks.grantFindMany.mockResolvedValue([]);
  mocks.grantFindFirst.mockResolvedValue(null);
  mocks.grantUpdate.mockResolvedValue({});
  mocks.grantCreate.mockResolvedValue({ id: `grant-${jobId}` });
  mocks.logAuditEntry.mockResolvedValue('audit-1');
}

describe('stayIdentityDayKey', () => {
  it('prefers structured checkout over preferredDate', () => {
    expect(
      stayIdentityDayKey({
        guestCheckOutDate: CHECKOUT_UTC,
        preferredDate: SERVICE_UTC,
      })
    ).toBe(CHECKOUT);
  });

  it('falls back to preferredDate when checkout absent', () => {
    expect(
      stayIdentityDayKey({
        guestCheckOutDate: null,
        preferredDate: SERVICE_UTC,
      })
    ).toBe(SERVICE);
  });
});

describe('Gate 2 structured stay-date resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProperty();
  });

  it('check-in, checkout, and service dates can differ; matches on checkout', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-structured',
        preferredDate: SERVICE_UTC,
        guestCheckOutDate: CHECKOUT_UTC,
        guestCheckInDate: CHECKIN_UTC,
      },
    ]);
    mockFeedbackAndTip('job-structured');

    const matched = await findCompletedJobsForStayDay(PROP, CHECKOUT);
    expect(matched?.jobs).toHaveLength(1);
    expect(matched?.jobs[0]?.matchSource).toBe('STRUCTURED_CHECKOUT');
    expect(matched?.jobs[0]?.id).toBe('job-structured');

    const result = await resolveStayToGuestFeedback(TOKEN, CHECKOUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.serviceDate).toBe(SERVICE);
      expect(result.feedbackToken).toBe('guest-fb-tok-structured');
      expect(result.tipGrantToken).toBeTruthy();
      expect(result).not.toHaveProperty('jobId');
      expect(JSON.stringify(result)).not.toMatch(/Bear Hill Road|address|cust-/i);
    }
    expect(mocks.feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ jobId: 'job-structured' }),
      })
    );
    expect(mocks.grantCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ jobId: 'job-structured' }),
      })
    );
  });

  it('checkout and turnover on the same date still resolves via structured checkout', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-same-day',
        preferredDate: SAME_DAY_UTC,
        guestCheckOutDate: SAME_DAY_UTC,
      },
    ]);
    mockFeedbackAndTip('job-same-day');

    const result = await resolveStayToGuestFeedback(TOKEN, '2026-10-02');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.serviceDate).toBe('2026-10-02');
      expect(result.feedbackToken).toBe('guest-fb-tok-same-day');
    }
  });

  it('turnover after checkout matches structured checkout, not service day', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-after',
        preferredDate: AFTER_CHECKOUT_SERVICE,
        guestCheckOutDate: AFTER_CHECKOUT,
      },
    ]);
    mockFeedbackAndTip('job-after');

    const onCheckout = await resolveStayToGuestFeedback(TOKEN, '2026-10-02');
    expect(onCheckout.ok).toBe(true);
    if (onCheckout.ok) {
      expect(onCheckout.serviceDate).toBe('2026-10-03');
      expect(onCheckout.feedbackToken).toBe('guest-fb-tok-after');
    }

    // Entering the service day must NOT match when structured checkout is set.
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-after',
        preferredDate: AFTER_CHECKOUT_SERVICE,
        guestCheckOutDate: AFTER_CHECKOUT,
      },
    ]);
    const onService = await findCompletedJobsForStayDay(PROP, '2026-10-03');
    expect(onService?.jobs).toHaveLength(0);
  });

  it('back-to-back stays with structured checkouts fail closed on ambiguity', async () => {
    const dayA = new Date('2026-09-20T00:00:00.000Z');
    const dayB = new Date('2026-09-22T00:00:00.000Z');
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-a',
        preferredDate: dayA,
        guestCheckOutDate: dayA,
      },
      {
        id: 'job-b',
        preferredDate: dayB,
        guestCheckOutDate: dayB,
      },
    ]);

    const eligible = await findSingleRecentEligibleStay(PROP);
    expect(eligible.status).toBe('NOT_AVAILABLE');

    const fallback = await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(fallback).toMatchObject({ ok: false, code: 'FALLBACK_NOT_AVAILABLE' });
    expect(JSON.stringify(fallback)).not.toMatch(/job-a|job-b/);
  });

  it('multiple completed jobs on the same checkout day → AMBIGUOUS', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-1',
        preferredDate: SERVICE_UTC,
        guestCheckOutDate: CHECKOUT_UTC,
      },
      {
        id: 'job-2',
        preferredDate: SERVICE_UTC,
        guestCheckOutDate: CHECKOUT_UTC,
      },
    ]);

    const result = await resolveStayToGuestFeedback(TOKEN, CHECKOUT);
    expect(result).toMatchObject({ ok: false, code: 'AMBIGUOUS' });
    expect(JSON.stringify(result)).not.toMatch(/job-1|job-2/);
  });

  it('missing structured dates use legacy preferredDate safely (Chipman/MJ/Lou Lou)', async () => {
    const chipmanDay = new Date('2026-08-15T00:00:00.000Z');
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-chipman',
        preferredDate: chipmanDay,
        guestCheckOutDate: null,
      },
    ]);
    mockFeedbackAndTip('job-chipman');

    const matched = await findCompletedJobsForStayDay(PROP, '2026-08-15');
    expect(matched?.jobs[0]?.matchSource).toBe('LEGACY_PREFERRED_DATE');

    const result = await resolveStayToGuestFeedback(TOKEN, '2026-08-15');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.serviceDate).toBe('2026-08-15');
      expect(result.feedbackToken).toBe('guest-fb-tok-chipman');
    }
  });

  it('exact structured checkout takes precedence over legacy preferredDate on same day', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-structured',
        preferredDate: SERVICE_UTC,
        guestCheckOutDate: CHECKOUT_UTC,
      },
      {
        id: 'job-legacy',
        preferredDate: CHECKOUT_UTC,
        guestCheckOutDate: null,
      },
    ]);
    mockFeedbackAndTip('job-structured');

    const matched = await findCompletedJobsForStayDay(PROP, CHECKOUT);
    expect(matched?.jobs).toHaveLength(1);
    expect(matched?.jobs[0]?.id).toBe('job-structured');
    expect(matched?.jobs[0]?.matchSource).toBe('STRUCTURED_CHECKOUT');

    const result = await resolveStayToGuestFeedback(TOKEN, CHECKOUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.feedbackToken).toBe('guest-fb-tok-structured');
    }
    expect(mocks.feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ jobId: 'job-structured' }),
      })
    );
  });

  it('legacy Mountain Joie / Lou Lou style single recent fallback still works', async () => {
    const day = new Date('2026-09-18T00:00:00.000Z');
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-mj', preferredDate: day, guestCheckOutDate: null },
    ]);
    mockFeedbackAndTip('job-mj');

    const eligible = await findSingleRecentEligibleStay(PROP);
    expect(eligible).toEqual({
      status: 'READY',
      dayKey: '2026-09-18',
      jobId: 'job-mj',
    });

    const result = await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.feedbackToken).toBe('guest-fb-tok-mj');
      expect(result.tipUrl).toMatch(/\/tip\?grant=/);
    }
  });

  it('feedback and tip authorization bind to the same resolved Job', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-bind',
        preferredDate: SERVICE_UTC,
        guestCheckOutDate: CHECKOUT_UTC,
      },
    ]);
    mockFeedbackAndTip('job-bind');

    const result = await resolveStayToGuestFeedback(TOKEN, CHECKOUT);
    expect(result.ok).toBe(true);

    const feedbackJobId = mocks.feedbackCreate.mock.calls[0][0].data.jobId;
    const tipJobId = mocks.grantCreate.mock.calls[0][0].data.jobId;
    expect(feedbackJobId).toBe('job-bind');
    expect(tipJobId).toBe('job-bind');
    expect(feedbackJobId).toBe(tipJobId);
  });

  it('structured job is not matched via preferredDate when checkout differs', async () => {
    mocks.jobFindMany.mockResolvedValue([
      {
        id: 'job-only-structured',
        preferredDate: SERVICE_UTC,
        guestCheckOutDate: CHECKOUT_UTC,
      },
    ]);

    const onServiceDay = await findCompletedJobsForStayDay(PROP, SERVICE);
    expect(onServiceDay?.jobs).toHaveLength(0);

    const noMatch = await resolveStayToGuestFeedback(TOKEN, SERVICE);
    expect(noMatch).toMatchObject({ ok: false, code: 'NO_MATCH' });
    expect(JSON.stringify(noMatch)).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
