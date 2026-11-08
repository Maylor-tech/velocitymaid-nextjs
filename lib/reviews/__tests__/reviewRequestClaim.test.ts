import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateMany, send } = vi.hoisted(() => ({
  updateMany: vi.fn(),
  send: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { reviewRequest: { updateMany } },
}));

import {
  REVIEW_REQUEST_CLAIM_STALE_MS,
  REVIEW_REQUEST_SAFE_RETRY_MS,
  claimReviewRequestSend,
  claimableReviewRequestWhere,
  deliverClaimedReviewRequest,
  expiredReviewClaimWhere,
  parkExpiredReviewClaims,
  reviewRequestAutomaticRetry,
  reviewRequestIdempotencyKey,
} from '@/lib/reviews/reviewRequestClaim';

const now = new Date('2026-11-08T16:00:00.000Z');
const request = {
  id: 'rr-1',
  toEmail: 'guest@example.com',
  toName: 'Guest',
  reviewUrl: 'https://example.com/review',
  now,
  send,
};

describe('review request idempotency window', () => {
  it('retries a stale claim while the original attempt is still inside 22 hours', () => {
    const firstProviderAttemptAt = new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS);
    expect(
      reviewRequestAutomaticRetry(
        {
          claimedAt: new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS - 60_000),
          firstProviderAttemptAt,
        },
        now
      )
    ).toBe('retry');
  });

  it('holds a fresh claim once the original attempt is past 22 hours', () => {
    expect(
      reviewRequestAutomaticRetry(
        {
          claimedAt: new Date(now.getTime() - 60_000),
          firstProviderAttemptAt: new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS - 1),
        },
        now
      )
    ).toBe('reconcile');
    expect(
      reviewRequestAutomaticRetry({ claimedAt: now, firstProviderAttemptAt: null }, now)
    ).toBe('reconcile');
  });

  it('does not steal a claim that is still inside the 15-minute window', () => {
    expect(
      reviewRequestAutomaticRetry(
        {
          claimedAt: new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS),
          firstProviderAttemptAt: new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS),
        },
        now
      )
    ).toBe('in_flight');
  });

  it('limits a reclaim to the original attempt, not the latest claimedAt', () => {
    const where = claimableReviewRequestWhere(now);
    expect(where.OR[2]).toEqual({
      sendStatus: 'CLAIMED',
      claimedAt: { lt: new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS) },
      firstProviderAttemptAt: { gte: new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS) },
    });
    expect(expiredReviewClaimWhere(now).OR).toEqual(
      expect.arrayContaining([
        { sendStatus: 'CLAIMED', firstProviderAttemptAt: null },
        { sendStatus: 'FAILED', firstProviderAttemptAt: null },
        {
          sendStatus: 'CLAIMED',
          firstProviderAttemptAt: { lt: new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS) },
        },
      ])
    );
  });
});

describe('review request claim ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
  });

  it('lets only one of two concurrent claims send, and both would use the same key', async () => {
    let claimed = false;
    updateMany.mockImplementation((args: { data?: { sendStatus?: string } }) => {
      if (args.data?.sendStatus === 'CLAIMED') {
        if (claimed) return Promise.resolve({ count: 0 });
        claimed = true;
      }
      return Promise.resolve({ count: 1 });
    });
    send.mockResolvedValue({ sent: true, id: 'email-1' });

    const [first, second] = await Promise.all([
      deliverClaimedReviewRequest(request),
      deliverClaimedReviewRequest(request),
    ]);

    expect(new Set([first, second])).toEqual(new Set(['not_claimed', 'sent']));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].idempotencyKey).toBe(reviewRequestIdempotencyKey('rr-1'));
  });

  it('records a definite failure only for the worker that still owns the claim', async () => {
    send.mockResolvedValue({ sent: false, error: 'mailbox unavailable', outcomeUnknown: false });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('failed');

    expect(updateMany.mock.calls[0][0].data).toMatchObject({
      sendStatus: 'CLAIMED',
      claimedAt: now,
      firstProviderAttemptAt: now,
    });
    expect(updateMany).toHaveBeenLastCalledWith({
      where: { id: 'rr-1', sendStatus: 'CLAIMED', claimedAt: now },
      data: expect.objectContaining({ sendStatus: 'FAILED', claimedAt: null }),
    });
    expect(updateMany.mock.calls.at(-1)?.[0].data).not.toHaveProperty('firstProviderAttemptAt');
  });

  it('holds an uncertain provider result instead of clearing the claim', async () => {
    send.mockResolvedValue({ sent: false, error: 'timeout', outcomeUnknown: true });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('unknown');

    expect(updateMany).toHaveBeenLastCalledWith({
      where: { id: 'rr-1', sendStatus: 'CLAIMED', claimedAt: now },
      data: expect.objectContaining({ sendStatus: 'UNKNOWN' }),
    });
    expect(updateMany.mock.calls.at(-1)?.[0].data.claimedAt).toBeUndefined();
  });

  it('does not let a late worker overwrite a newer claim outcome', async () => {
    send.mockImplementation(async () => {
      updateMany.mockResolvedValueOnce({ count: 0 });
      return { sent: false, error: 'late failure', outcomeUnknown: false };
    });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('superseded');

    const record = updateMany.mock.calls.at(-1)?.[0];
    expect(record.where).toEqual({ id: 'rr-1', sendStatus: 'CLAIMED', claimedAt: now });
    expect(record.data.sendStatus).toBe('FAILED');
  });

  it('keeps the claim when acceptance cannot be saved', async () => {
    send.mockResolvedValue({ sent: true, id: 'email-accepted' });
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('accepted_unrecorded');
  });

  it('passes the stable idempotency key on every automatic send', async () => {
    send.mockResolvedValue({ sent: true, id: 'email-2' });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('sent');
    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('sent');

    expect(send.mock.calls.map((call) => call[0].idempotencyKey)).toEqual([
      'review-request-rr-1',
      'review-request-rr-1',
    ]);
  });
});

type StoredReviewRequest = {
  sendStatus: string | null;
  claimedAt: Date | null;
  firstProviderAttemptAt: Date | null;
  sentAt: Date | null;
};

function dateMatches(value: Date | null, filter: unknown): boolean {
  if (filter === null) return value === null;
  if (filter instanceof Date) return value?.getTime() === filter.getTime();
  if (!filter || typeof filter !== 'object') return true;
  const range = filter as { lt?: Date; gte?: Date };
  if (value == null) return false;
  const time = value.getTime();
  if (range.lt && !(time < range.lt.getTime())) return false;
  if (range.gte && !(time >= range.gte.getTime())) return false;
  return true;
}

function whereMatches(row: StoredReviewRequest, where: Record<string, unknown>): boolean {
  if (where.id != null && where.id !== 'rr-1') return false;
  if (where.sentAt === null && row.sentAt != null) return false;
  if (typeof where.sendStatus !== 'undefined' && row.sendStatus !== where.sendStatus) return false;
  if ('claimedAt' in where && !dateMatches(row.claimedAt, where.claimedAt)) return false;
  if (
    'firstProviderAttemptAt' in where &&
    !dateMatches(row.firstProviderAttemptAt, where.firstProviderAttemptAt)
  ) {
    return false;
  }
  if (Array.isArray(where.OR)) {
    return where.OR.some((branch) => whereMatches(row, branch as Record<string, unknown>));
  }
  return true;
}

describe('original attempt clock across retries', () => {
  let row: StoredReviewRequest;

  beforeEach(() => {
    row = {
      sendStatus: null,
      claimedAt: null,
      firstProviderAttemptAt: null,
      sentAt: null,
    };
    send.mockClear();
    updateMany.mockClear();
    updateMany.mockImplementation(async (args: { where: Record<string, unknown>; data: Partial<StoredReviewRequest> }) => {
      if (!whereMatches(row, args.where)) return { count: 0 };
      if ('sendStatus' in args.data) row.sendStatus = args.data.sendStatus ?? null;
      if ('claimedAt' in args.data) row.claimedAt = args.data.claimedAt ?? null;
      if ('firstProviderAttemptAt' in args.data) {
        row.firstProviderAttemptAt = args.data.firstProviderAttemptAt ?? null;
      }
      if ('sentAt' in args.data) row.sentAt = args.data.sentAt ?? null;
      return { count: 1 };
    });
    send.mockResolvedValue({ sent: false, error: 'mailbox unavailable', outcomeUnknown: false });
  });

  it('keeps the first attempt time across consecutive retries', async () => {
    const start = new Date('2026-11-08T00:00:00.000Z');
    const attempts = [0, 60, 120].map(
      (minutes) => new Date(start.getTime() + minutes * 60 * 1000)
    );

    for (const attempt of attempts) {
      await expect(
        deliverClaimedReviewRequest({ ...request, now: attempt, send })
      ).resolves.toBe('failed');
      expect(row.firstProviderAttemptAt).toEqual(start);
    }

    expect(send.mock.calls.map((call) => call[0].idempotencyKey)).toEqual([
      'review-request-rr-1',
      'review-request-rr-1',
      'review-request-rr-1',
    ]);
    const retryClaims = updateMany.mock.calls.filter(
      (call) =>
        call[0].data.sendStatus === 'CLAIMED' &&
        !Object.prototype.hasOwnProperty.call(call[0].data, 'firstProviderAttemptAt') &&
        call[0].where.firstProviderAttemptAt?.gte instanceof Date
    );
    expect(retryClaims).toHaveLength(2);
  });

  it('retries just inside the original 22-hour window', async () => {
    const start = new Date('2026-11-08T00:00:00.000Z');
    await deliverClaimedReviewRequest({ ...request, now: start, send });
    send.mockClear();

    const inside = new Date(start.getTime() + REVIEW_REQUEST_SAFE_RETRY_MS);
    await expect(
      deliverClaimedReviewRequest({ ...request, now: inside, send })
    ).resolves.toBe('failed');

    expect(send).toHaveBeenCalledTimes(1);
    expect(row.firstProviderAttemptAt).toEqual(start);
    expect(send.mock.calls[0][0].idempotencyKey).toBe('review-request-rr-1');
  });

  it('does not retry after the original cutoff when the latest claim is fresh', async () => {
    const start = new Date('2026-11-08T00:00:00.000Z');
    const later = new Date(start.getTime() + REVIEW_REQUEST_SAFE_RETRY_MS + 1);
    row.sendStatus = 'CLAIMED';
    row.claimedAt = new Date(later.getTime() - 60_000);
    row.firstProviderAttemptAt = start;

    await expect(claimReviewRequestSend('rr-1', later)).resolves.toBeNull();
    expect(row.claimedAt).toEqual(new Date(later.getTime() - 60_000));
    expect(row.firstProviderAttemptAt).toEqual(start);

    await expect(parkExpiredReviewClaims(later)).resolves.toBe(1);
    expect(row.sendStatus).toBe('UNKNOWN');
    expect(row.firstProviderAttemptAt).toEqual(start);
    expect(send).not.toHaveBeenCalled();
  });

  it('reconciles a legacy claim that has no attempt timestamp and leaves an unsent row eligible', async () => {
    row.sendStatus = 'CLAIMED';
    row.claimedAt = now;
    row.firstProviderAttemptAt = null;

    await expect(parkExpiredReviewClaims(now)).resolves.toBe(1);
    expect(row.sendStatus).toBe('UNKNOWN');

    row.sendStatus = null;
    row.claimedAt = null;
    row.firstProviderAttemptAt = null;
    await expect(parkExpiredReviewClaims(now)).resolves.toBe(0);
    await expect(claimReviewRequestSend('rr-1', now)).resolves.toEqual({ claimedAt: now });
    expect(row.firstProviderAttemptAt).toEqual(now);
    expect(row.claimedAt).toEqual(now);
  });

  it('does not let a delayed worker replace an outcome owned by a newer claim', async () => {
    const start = new Date('2026-11-08T00:00:00.000Z');
    const newerClaim = new Date(start.getTime() + 20 * 60 * 1000);
    send.mockImplementation(async () => {
      row.claimedAt = newerClaim;
      return { sent: false, error: 'late failure', outcomeUnknown: false as const };
    });

    await expect(
      deliverClaimedReviewRequest({ ...request, now: start, send })
    ).resolves.toBe('superseded');

    expect(row.sendStatus).toBe('CLAIMED');
    expect(row.claimedAt).toEqual(newerClaim);
    expect(row.firstProviderAttemptAt).toEqual(start);
  });
});
