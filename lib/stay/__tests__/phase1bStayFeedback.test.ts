import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobStatus, ServiceFeedbackSource } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  propertyFindFirst: vi.fn(),
  propertyFindUnique: vi.fn(),
  propertyUpdate: vi.fn(),
  jobFindMany: vi.fn(),
  jobFindUnique: vi.fn(),
  feedbackFindUnique: vi.fn(),
  feedbackCreate: vi.fn(),
  feedbackUpdateMany: vi.fn(),
  grantCreate: vi.fn(),
  grantFindMany: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const prisma = {
    property: {
      findFirst: mocks.propertyFindFirst,
      findUnique: mocks.propertyFindUnique,
      update: mocks.propertyUpdate,
    },
    job: {
      findMany: mocks.jobFindMany,
      findUnique: mocks.jobFindUnique,
    },
    serviceFeedback: {
      findUnique: mocks.feedbackFindUnique,
      create: mocks.feedbackCreate,
      updateMany: mocks.feedbackUpdateMany,
    },
    guestTipAuthorization: {
      create: mocks.grantCreate,
      findMany: mocks.grantFindMany,
    },
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'job-1' }]),
    $transaction: async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
  };
  return { prisma };
});

vi.mock('@/lib/audit', () => ({
  logAuditEntry: mocks.logAuditEntry,
}));

import {
  ensureGuestServiceFeedbackForJob,
  getFeedbackWorkflowState,
  getPublicFeedbackByToken,
  requestServiceFeedbackForJob,
  submitPublicFeedback,
} from '@/lib/feedback/serviceFeedback';
import { resolveStayToGuestFeedback } from '@/lib/stay/resolveStay';
import { generateGuestAccessToken } from '@/lib/stay/propertyGuestAccess';
import {
  _resetStayResolveRateLimitForTests,
  checkStayResolveRateLimit,
} from '@/lib/stay/rateLimit';

const DAY = '2026-10-04';
const DAY_UTC = new Date('2026-10-04T00:00:00.000Z');
const TOKEN = 'opaque-guest-token-abcdefghijklmnopqrstuvwxyz012345';

describe('Phase 1B guest stay resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('audit-1');
    mocks.grantFindMany.mockResolvedValue([]);
    mocks.grantCreate.mockResolvedValue({ id: 'grant-1' });
  });

  it('generates high-entropy opaque tokens (not cuid-like short ids)', () => {
    const a = generateGuestAccessToken();
    const b = generateGuestAccessToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(a).not.toMatch(/^c[a-z0-9]{20,}$/);
  });

  it('valid token + exact completed job → creates GUEST feedback', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: 'Lakeside Cottage',
      guestAccessToken: TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
    ]);
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      archivedAt: null,
      customerId: 'cust-1',
      assignedCleanerId: 'cleaner-1',
      propertyId: 'prop-1',
    });
    mocks.feedbackFindUnique.mockResolvedValue(null);
    mocks.feedbackCreate.mockResolvedValue({
      id: 'fb-guest',
      publicToken: 'guest-tok',
      jobId: 'job-1',
      source: ServiceFeedbackSource.GUEST,
      status: 'REQUESTED',
    });

    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.feedbackToken).toBe('guest-tok');
      expect(result.tipGrantToken).toBeTruthy();
      expect(result.tipUrl).toMatch(/\/tip\?grant=/);
      expect(result.propertyLabel).toBe('Lakeside Cottage');
      expect(result.serviceDate).toBe(DAY);
      expect(JSON.stringify(result)).not.toMatch(/job-1|cust-1|cleaner/);
    }
    expect(mocks.grantCreate).toHaveBeenCalled();
    expect(mocks.feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: ServiceFeedbackSource.GUEST,
          jobId: 'job-1',
        }),
      })
    );
  });

  it('no matching job → NO_MATCH safe failure', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: null,
      guestAccessToken: TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([]);

    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result).toMatchObject({ ok: false, code: 'NO_MATCH' });
    expect(mocks.feedbackCreate).not.toHaveBeenCalled();
  });

  it('two matching completed jobs → AMBIGUOUS fail closed', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: null,
      guestAccessToken: TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-a', preferredDate: DAY_UTC },
      { id: 'job-b', preferredDate: DAY_UTC },
    ]);

    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result).toMatchObject({ ok: false, code: 'AMBIGUOUS' });
    expect(mocks.feedbackCreate).not.toHaveBeenCalled();
  });

  it('invalid token → INVALID_TOKEN', async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);
    const result = await resolveStayToGuestFeedback('not-a-real-token', DAY);
    expect(result).toMatchObject({ ok: false, code: 'INVALID_TOKEN' });
  });

  it('revoked token fails lookup (findFirst returns null)', async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);
    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result).toMatchObject({ ok: false, code: 'INVALID_TOKEN' });
    expect(mocks.propertyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guestAccessRevokedAt: null,
        }),
      })
    );
  });

  it('wrong property isolation — jobs queried only for resolved propertyId', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-A',
      guestDisplayName: null,
      guestAccessToken: TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([]);
    await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(mocks.jobFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyId: 'prop-A',
          status: JobStatus.COMPLETED,
          archivedAt: null,
        }),
      })
    );
  });

  it('incomplete job not in COMPLETED query', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: null,
      guestAccessToken: TOKEN,
    });
    // DB query filters COMPLETED; incomplete jobs never returned
    mocks.jobFindMany.mockResolvedValue([]);
    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result).toMatchObject({ ok: false, code: 'NO_MATCH' });
    expect(mocks.jobFindMany.mock.calls[0][0].where.status).toBe(
      JobStatus.COMPLETED
    );
  });

  it('archived jobs excluded via archivedAt: null', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: null,
      guestAccessToken: TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([]);
    await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(mocks.jobFindMany.mock.calls[0][0].where.archivedAt).toBeNull();
  });

  it('repeat guest resolution reuses same GUEST row', async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: 'Cottage',
      guestAccessToken: TOKEN,
    });
    mocks.jobFindMany.mockResolvedValue([
      { id: 'job-1', preferredDate: DAY_UTC },
    ]);
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      archivedAt: null,
      customerId: 'cust-1',
      assignedCleanerId: null,
      propertyId: 'prop-1',
    });
    mocks.feedbackFindUnique.mockResolvedValue({
      id: 'fb-guest',
      publicToken: 'same-guest-tok',
      jobId: 'job-1',
      source: ServiceFeedbackSource.GUEST,
    });

    const first = await resolveStayToGuestFeedback(TOKEN, DAY);
    const second = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.feedbackToken).toBe('same-guest-tok');
      expect(second.feedbackToken).toBe('same-guest-tok');
      expect(first.tipGrantToken).not.toEqual(second.tipGrantToken);
    }
    expect(mocks.feedbackCreate).not.toHaveBeenCalled();
    expect(mocks.grantCreate).toHaveBeenCalledTimes(2);
  });

  it('rate limit eventually blocks (durable Postgres buckets)', async () => {
    // Covered in phase1bHardening.test.ts with ApiRateLimitBucket mocks + resolve route.
    expect(typeof checkStayResolveRateLimit).toBe('function');
    expect(typeof _resetStayResolveRateLimitForTests).toBe('function');
  });
});

describe('Phase 1B HOST + GUEST coexistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('audit-1');
  });

  it('ensureGuest creates GUEST while HOST may already exist', async () => {
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
      id: 'fb-g',
      publicToken: 'g-tok',
      source: ServiceFeedbackSource.GUEST,
      jobId: 'job-1',
    });

    const guest = await ensureGuestServiceFeedbackForJob('job-1');
    expect(guest.created).toBe(true);
    expect(mocks.feedbackFindUnique).toHaveBeenCalledWith({
      where: {
        jobId_source: { jobId: 'job-1', source: ServiceFeedbackSource.GUEST },
      },
    });
    expect(mocks.feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: ServiceFeedbackSource.GUEST }),
      })
    );
  });

  it('HOST workflow never returns GUEST row', async () => {
    mocks.feedbackFindUnique.mockResolvedValue({
      id: 'fb-host',
      publicToken: 'host-tok',
      source: ServiceFeedbackSource.HOST,
      status: 'REQUESTED',
      submittedAt: null,
      requestedAt: new Date(),
      reminderSentAt: null,
      overallRating: null,
    });

    const state = await getFeedbackWorkflowState('job-1');
    expect(state.publicToken).toBe('host-tok');
    expect(mocks.feedbackFindUnique).toHaveBeenCalledWith({
      where: {
        jobId_source: { jobId: 'job-1', source: ServiceFeedbackSource.HOST },
      },
    });
  });

  it('getFeedbackWorkflowState stays pending when only GUEST exists', async () => {
    mocks.feedbackFindUnique.mockResolvedValue(null);
    const state = await getFeedbackWorkflowState('job-1');
    expect(state.state).toBe('pending');
    expect(state.publicToken).toBeNull();
  });

  it('requestServiceFeedbackForJob scopes to HOST and does not see GUEST', async () => {
    mocks.jobFindUnique.mockResolvedValue({
      id: 'job-1',
      status: JobStatus.COMPLETED,
      customerId: 'cust-1',
      assignedCleanerId: null,
      propertyId: 'prop-1',
      Customer: {
        id: 'cust-1',
        email: 'host@example.com',
        firstName: 'H',
        lastName: 'Ost',
      },
    });
    mocks.feedbackFindUnique.mockResolvedValue(null);
    mocks.feedbackCreate.mockResolvedValue({
      id: 'fb-h',
      publicToken: 'host-new',
      source: ServiceFeedbackSource.HOST,
    });

    await requestServiceFeedbackForJob('job-1');
    expect(mocks.feedbackFindUnique).toHaveBeenCalledWith({
      where: {
        jobId_source: { jobId: 'job-1', source: ServiceFeedbackSource.HOST },
      },
    });
    expect(mocks.feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: ServiceFeedbackSource.HOST }),
      })
    );
  });

  it('guest submit updates only the GUEST token row (updateMany by id)', async () => {
    mocks.feedbackFindUnique.mockResolvedValue({
      id: 'fb-guest',
      publicToken: 'guest-tok',
      source: ServiceFeedbackSource.GUEST,
      status: 'REQUESTED',
      submittedAt: null,
    });
    mocks.feedbackUpdateMany.mockResolvedValue({ count: 1 });

    const result = await submitPublicFeedback('guest-tok', {
      overallRating: 5,
      cleanlinessRating: 5,
      communicationRating: 5,
      timelinessRating: 5,
    });
    expect(result.ok).toBe(true);
    expect(mocks.feedbackUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'fb-guest' }),
      })
    );
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ actorRole: 'GUEST' })
    );
  });

  it('HOST submit path is independent (different token/id)', async () => {
    mocks.feedbackFindUnique.mockResolvedValue({
      id: 'fb-host',
      publicToken: 'host-tok',
      source: ServiceFeedbackSource.HOST,
      status: 'REQUESTED',
      submittedAt: null,
    });
    mocks.feedbackUpdateMany.mockResolvedValue({ count: 1 });

    await submitPublicFeedback('host-tok', {
      overallRating: 4,
      cleanlinessRating: 4,
      communicationRating: 4,
      timelinessRating: 4,
    });
    expect(mocks.feedbackUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'fb-host' }),
      })
    );
    expect(mocks.logAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ actorRole: 'CUSTOMER' })
    );
  });

  it('public guest payload omits PII and job id', async () => {
    mocks.feedbackFindUnique.mockResolvedValue({
      publicToken: 'guest-tok',
      status: 'REQUESTED',
      submittedAt: null,
      source: ServiceFeedbackSource.GUEST,
      Job: {
        preferredDate: DAY_UTC,
        address: '99 Secret Lane',
        Property: {
          name: 'Owner Surname House',
          address: '99 Secret Lane',
          guestDisplayName: 'Birch Cabin',
        },
      },
    });
    const view = await getPublicFeedbackByToken('guest-tok');
    expect(view).toEqual({
      state: 'ready',
      token: 'guest-tok',
      propertyLabel: 'Birch Cabin',
      serviceDate: expect.stringMatching(/October/),
    });
    expect(JSON.stringify(view)).not.toMatch(
      /Secret|Surname|job-|email|phone|invoice|cleaner/i
    );
  });
});
