/**
 * Stay tip availability — selectable dates + remint tip URL on resolve.
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
  listRecentCompletedStayDates,
  resolveStayToGuestFeedback,
} from '@/lib/stay/resolveStay';
import { mintGuestTipAuthorization } from '@/lib/tips/guestTipAuthorization';

const TOKEN = 'opaqueStayTokenForTipUxabcdefghijklmnopqrstuvwxyz0123';
const DAY = '2026-09-05';
const DAY_UTC = new Date('2026-09-05T00:00:00.000Z');

describe('listRecentCompletedStayDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns opaque YYYY-MM-DD keys only, newest first, de-duped', async () => {
    mocks.jobFindMany.mockResolvedValue([
      { preferredDate: new Date('2026-09-05T00:00:00.000Z') },
      { preferredDate: new Date('2026-09-05T12:00:00.000Z') },
      { preferredDate: new Date('2026-08-29T00:00:00.000Z') },
    ]);
    const dates = await listRecentCompletedStayDates('prop-1');
    expect(dates).toEqual(['2026-09-05', '2026-08-29']);
    expect(JSON.stringify(dates)).not.toMatch(/job|prop-/i);
  });
});

describe('resolveStay tip always available after match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logAuditEntry.mockResolvedValue('a1');
    mocks.propertyFindFirst.mockResolvedValue({
      id: 'prop-1',
      guestDisplayName: 'Chipman Park Stay',
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
      id: 'fb1',
      publicToken: 'fb-tok',
      source: ServiceFeedbackSource.GUEST,
    });
    mocks.grantFindFirst.mockResolvedValue(null);
    mocks.grantFindMany.mockResolvedValue([]);
    mocks.grantUpdate.mockResolvedValue({});
    mocks.grantCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'g-new',
      ...data,
    }));
  });

  it('first resolve returns tip URL (MINTED)', async () => {
    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tipGrantStatus).toBe('MINTED');
      expect(result.tipGrantToken).toBeTruthy();
      expect(result.tipUrl).toMatch(/\/tip\?grant=/);
    }
  });

  it('second resolve remints tip URL (REISSUED) instead of blocking', async () => {
    mocks.grantFindMany.mockResolvedValue([
      { id: 'grant-old', expiresAt: new Date(Date.now() + 3600_000) },
    ]);
    const result = await resolveStayToGuestFeedback(TOKEN, DAY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tipGrantStatus).toBe('REISSUED');
      expect(result.tipGrantToken).toBeTruthy();
      expect(result.tipUrl).toMatch(/\/tip\?grant=/);
    }
    expect(mocks.grantUpdate).toHaveBeenCalled();
    expect(mocks.grantCreate).toHaveBeenCalled();
  });

  it('mint without replaceActive still bounds concurrent second mint', async () => {
    mocks.grantFindMany.mockResolvedValue([
      { id: 'g1', expiresAt: new Date(Date.now() + 3600_000) },
    ]);
    const second = await mintGuestTipAuthorization({
      jobId: 'job-1',
      propertyId: 'prop-1',
    });
    expect(second.status).toBe('ALREADY_ACTIVE');
  });
});
