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
  claimableReviewRequestWhere,
  deliverClaimedReviewRequest,
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
  it('retries a claim older than 15 minutes with the same key while Resend still retains it', () => {
    const claimedAt = new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS - 60_000);
    expect(reviewRequestAutomaticRetry(claimedAt, now)).toBe('retry');
    expect(reviewRequestAutomaticRetry(new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS), now)).toBe(
      'retry'
    );
  });

  it('holds a claim once a retry would fall outside Resend retention', () => {
    const claimedAt = new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS - 1);
    expect(reviewRequestAutomaticRetry(claimedAt, now)).toBe('reconcile');
    expect(reviewRequestAutomaticRetry(null, now)).toBe('reconcile');
  });

  it('does not steal a claim that is still inside the 15-minute window', () => {
    expect(reviewRequestAutomaticRetry(new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS), now)).toBe(
      'in_flight'
    );
  });

  it('limits the database claim to the safe retry interval', () => {
    const where = claimableReviewRequestWhere(now);
    const staleClaim = where.OR[2];
    expect(staleClaim).toMatchObject({
      sendStatus: 'CLAIMED',
      claimedAt: {
        lt: new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS),
        gte: new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS),
      },
    });
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

    expect(updateMany).toHaveBeenLastCalledWith({
      where: { id: 'rr-1', sendStatus: 'CLAIMED', claimedAt: now },
      data: expect.objectContaining({ sendStatus: 'FAILED', claimedAt: null }),
    });
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
