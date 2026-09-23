/**
 * Stay Card Option B — SINGLE_RECENT_ELIGIBLE fallback + date-oracle privacy.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobStatus, ServiceFeedbackSource } from '@prisma/client';
import { NextRequest } from 'next/server';

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
  rateCreate: vi.fn(),
  rateUpdateMany: vi.fn(),
  rateDeleteMany: vi.fn(),
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
    apiRateLimitBucket: {
      create: mocks.rateCreate,
      updateMany: mocks.rateUpdateMany,
      deleteMany: mocks.rateDeleteMany,
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
  findSingleRecentEligibleStay,
  isStayFallbackEligible,
  resolveStayToGuestFeedback,
  STAY_FALLBACK_LOOKBACK_DAYS,
  STAY_RESOLVE_MODE_SINGLE_RECENT,
} from '@/lib/stay/resolveStay';
import { GET as stayGet } from '@/app/api/stay/[token]/route';
import { POST as stayResolvePost } from '@/app/api/stay/[token]/resolve/route';
import {
  checkStayResolveRateLimit,
  _resetStayResolveRateLimitForTests,
} from '@/lib/stay/rateLimit';
import { STAY_CARD_COPY, STAY_CARD_VERSION } from '@/lib/stay/stayCardCopy';

const TOKEN = 'opaqueFallbackTokenabcdefghijklmnopqrstuvwxyz0123456789';
const DAY = '2026-09-20';
const DAY_UTC = new Date('2026-09-20T00:00:00.000Z');
const OTHER_DAY_UTC = new Date('2026-09-18T00:00:00.000Z');

function mockProperty() {
  mocks.propertyFindFirst.mockResolvedValue({
    id: 'prop-1',
    guestDisplayName: 'Fern Hill',
    guestAccessToken: TOKEN,
  });
}

function mockJobAndFeedback(jobId = 'job-1') {
  mocks.jobFindUnique.mockResolvedValue({
    id: jobId,
    status: JobStatus.COMPLETED,
    archivedAt: null,
    customerId: 'cust-1',
    assignedCleanerId: 'cleaner-1',
    propertyId: 'prop-1',
  });
  mocks.feedbackFindUnique.mockResolvedValue(null);
  mocks.feedbackCreate.mockResolvedValue({
    id: 'fb-guest',
    publicToken: 'guest-fb-tok',
    jobId,
    source: ServiceFeedbackSource.GUEST,
    status: 'REQUESTED',
  });
  mocks.grantFindMany.mockResolvedValue([]);
  mocks.grantFindFirst.mockResolvedValue(null);
  mocks.grantUpdate.mockResolvedValue({});
  mocks.grantCreate.mockResolvedValue({ id: 'grant-1' });
  mocks.logAuditEntry.mockResolvedValue('audit-1');
}

describe('Stay Card copy v1.1', () => {
  it('prints help-identify-stay line without requiring remembered checkout alone', () => {
    expect(STAY_CARD_VERSION).toBe('VM-STAY-CARD-v1.1');
    expect(STAY_CARD_COPY.checkoutHint).toBe(
      'No login required. We’ll help you identify your stay.'
    );
    expect(STAY_CARD_COPY.checkoutHint.toLowerCase()).not.toContain(
      'you’ll only need your checkout date'
    );
  });
});

describe('date-oracle privacy (NO_MATCH / GET)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProperty();
    mocks.logAuditEntry.mockResolvedValue('a1');
  });

  it('NO_MATCH never lists available completed dates', async () => {
    // First call: day match empty. Must not call a second listing query that
    // would leak dates into the message.
    mocks.jobFindMany.mockResolvedValue([]);
    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result).toMatchObject({ ok: false, code: 'NO_MATCH' });
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.message).not.toMatch(/Available completed dates/i);
      expect(result.message).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
    // Only the day-match query — no secondary date-list oracle query
    expect(mocks.jobFindMany).toHaveBeenCalledTimes(1);
  });

  it('GET stay returns fallbackEligible boolean and never recentCheckoutDates', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
    ]);
    const res = await stayGet(
      new NextRequest(`http://localhost/api/stay/${TOKEN}`),
      { params: { token: TOKEN } }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.displayName).toBe('Fern Hill');
    expect(body.fallbackEligible).toBe(true);
    expect(body).not.toHaveProperty('recentCheckoutDates');
    expect(JSON.stringify(body)).not.toMatch(/2026-09-20/);
  });

  it('invalid token GET remains opaque 404', async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);
    const res = await stayGet(
      new NextRequest('http://localhost/api/stay/bad-token'),
      { params: { token: 'bad-token' } }
    );
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.code).toBe('INVALID_TOKEN');
    expect(body).not.toHaveProperty('fallbackEligible');
    expect(body).not.toHaveProperty('recentCheckoutDates');
  });
});

describe('findSingleRecentEligibleStay / isStayFallbackEligible', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`uses ${STAY_FALLBACK_LOOKBACK_DAYS}-day lookback`, () => {
    expect(STAY_FALLBACK_LOOKBACK_DAYS).toBe(14);
  });

  it('READY when exactly one day and one job', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
    ]);
    const result = await findSingleRecentEligibleStay('prop-1');
    expect(result).toEqual({
      status: 'READY',
      dayKey: DAY,
      jobId: 'job-1',
    });
    expect(await isStayFallbackEligible('prop-1')).toBe(true);
  });

  it('NOT_AVAILABLE when two distinct recent days (back-to-back)', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
      { id: 'job-2', preferredDate: OTHER_DAY_UTC },
    ]);
    const result = await findSingleRecentEligibleStay('prop-1');
    expect(result.status).toBe('NOT_AVAILABLE');
    expect(await isStayFallbackEligible('prop-1')).toBe(false);
  });

  it('AMBIGUOUS_DAY when two jobs share one day', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-a', preferredDate: DAY_UTC },
      { id: 'job-b', preferredDate: DAY_UTC },
    ]);
    const result = await findSingleRecentEligibleStay('prop-1');
    expect(result).toMatchObject({ status: 'AMBIGUOUS_DAY', dayKey: DAY });
    expect(await isStayFallbackEligible('prop-1')).toBe(false);
  });

  it('NOT_AVAILABLE when zero completed jobs', async () => {
    mocks.jobFindMany.mockResolvedValue([]);
    expect(await findSingleRecentEligibleStay('prop-1')).toEqual({
      status: 'NOT_AVAILABLE',
    });
    expect(await isStayFallbackEligible('prop-1')).toBe(false);
  });
});

describe('SINGLE_RECENT_ELIGIBLE resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProperty();
    mockJobAndFeedback();
  });

  it('succeeds iff exactly one eligible completed day + one job', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
    ]);
    const result = await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.feedbackToken).toBe('guest-fb-tok');
      expect(result.tipGrantToken).toBeTruthy();
      expect(result.tipUrl).toMatch(/\/tip\?grant=/);
      expect(result.serviceDate).toBe(DAY);
      expect(result.propertyLabel).toBe('Fern Hill');
      expect(JSON.stringify(result)).not.toMatch(/job-1/);
      expect(JSON.stringify(result)).not.toMatch(/cust-1|cleaner-1/);
    }
  });

  it('fails when two distinct recent days — no jobId leak', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
      { id: 'job-2', preferredDate: OTHER_DAY_UTC },
    ]);
    const result = await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(result).toMatchObject({
      ok: false,
      code: 'FALLBACK_NOT_AVAILABLE',
    });
    expect(JSON.stringify(result)).not.toMatch(/job-/);
    expect(mocks.feedbackCreate).not.toHaveBeenCalled();
  });

  it('fails when zero completed in window', async () => {
    mocks.jobFindMany.mockResolvedValue([]);
    const result = await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(result).toMatchObject({
      ok: false,
      code: 'FALLBACK_NOT_AVAILABLE',
    });
  });

  it('same-day multi-job → AMBIGUOUS', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-a', preferredDate: DAY_UTC },
      { id: 'job-b', preferredDate: DAY_UTC },
    ]);
    const result = await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(result).toMatchObject({ ok: false, code: 'AMBIGUOUS' });
  });

  it('invalid token same as date path', async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);
    const result = await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(result).toMatchObject({ ok: false, code: 'INVALID_TOKEN' });
  });

  it('mutual exclusion: checkoutDate + mode → INVALID_REQUEST', async () => {
    const result = await resolveStayToGuestFeedback(TOKEN, {
      checkoutDate: DAY,
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(result).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
    expect(mocks.jobFindMany).not.toHaveBeenCalled();
  });

  it('incomplete jobs never appear in COMPLETED fallback query', async () => {
    mocks.jobFindMany.mockResolvedValue([]);
    await resolveStayToGuestFeedback(TOKEN, {
      mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
    });
    expect(mocks.jobFindMany.mock.calls[0][0].where.status).toBe(
      JobStatus.COMPLETED
    );
  });

  it('checkout date remains primary resolver', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
    ]);
    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.serviceDate).toBe(DAY);
      expect(result.tipGrantStatus).toMatch(/MINTED|REISSUED/);
    }
  });
});

describe('resolve route security wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateCreate.mockResolvedValue({ id: 'b1', count: 1 });
    mocks.rateUpdateMany.mockResolvedValue({ count: 1 });
    mockProperty();
    mockJobAndFeedback();
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
    ]);
  });

  it('rejects client-supplied jobId', async () => {
    const res = await stayResolvePost(
      new NextRequest(`http://localhost/api/stay/${TOKEN}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: STAY_RESOLVE_MODE_SINGLE_RECENT,
          jobId: 'job-attacker',
        }),
      }),
      { params: { token: TOKEN } }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('INVALID_REQUEST');
  });

  it('fallback resolve counts toward rate limit (429 before resolve logic)', async () => {
    mocks.rateCreate.mockRejectedValue(new Error('Unique constraint'));
    mocks.rateUpdateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });

    const res = await stayResolvePost(
      new NextRequest(`http://localhost/api/stay/${TOKEN}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '198.51.100.20',
        },
        body: JSON.stringify({ mode: STAY_RESOLVE_MODE_SINGLE_RECENT }),
      }),
      { params: { token: TOKEN } }
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(mocks.propertyFindFirst).not.toHaveBeenCalled();
  });

  it('success payload excludes job/customer/cleaner ids', async () => {
    const res = await stayResolvePost(
      new NextRequest(`http://localhost/api/stay/${TOKEN}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: STAY_RESOLVE_MODE_SINGLE_RECENT }),
      }),
      { params: { token: TOKEN } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.feedbackToken).toBeTruthy();
    expect(body.tipGrantToken).toBeTruthy();
    expect(JSON.stringify(body)).not.toMatch(/job-1|cust-1|cleaner-1|prop-1/);
  });

  it('rate-limit helpers remain available for stay-resolve buckets', async () => {
    await _resetStayResolveRateLimitForTests();
    expect(typeof checkStayResolveRateLimit).toBe('function');
  });
});
