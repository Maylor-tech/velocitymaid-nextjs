import { prisma } from '@/lib/prisma';
import {
  sendReviewRequestEmail,
  type SendReviewRequestEmailResult,
} from '@/lib/email/sendReviewRequestEmail';

/**
 * Resend stores an idempotency key for 24 hours and replays the original
 * response for the same key and the same payload.
 * https://resend.com/docs/dashboard/emails/idempotency-keys
 */
export const RESEND_IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Automatic retries stop two hours before that retention ends, so the retry
 * request itself is still inside the 24-hour window.
 */
export const REVIEW_REQUEST_SAFE_RETRY_MS = RESEND_IDEMPOTENCY_RETENTION_MS - 2 * 60 * 60 * 1000;

/** Leave a live claim alone so a slow worker can finish. */
export const REVIEW_REQUEST_CLAIM_STALE_MS = 15 * 60 * 1000;

export type ReviewRequestDeliveryOutcome =
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'unknown'
  | 'accepted_unrecorded'
  | 'superseded'
  | 'not_claimed';

export type ReviewRequestRetryDisposition = 'in_flight' | 'retry' | 'reconcile';

export function reviewRequestIdempotencyKey(reviewRequestId: string): string {
  return `review-request-${reviewRequestId}`;
}

export type ReviewRequestAttemptClock = {
  /** Worker ownership. A reclaim replaces this. */
  claimedAt: Date | null;
  /** Idempotency-key start. A reclaim must not replace this. */
  firstProviderAttemptAt: Date | null;
};

/**
 * The 22-hour cutoff uses the original provider attempt. A fresh claimedAt
 * does not extend it. A missing attempt timestamp cannot be retried safely.
 */
export function reviewRequestAutomaticRetry(
  input: ReviewRequestAttemptClock,
  now = new Date()
): ReviewRequestRetryDisposition {
  const attemptAt = input.firstProviderAttemptAt;
  if (!attemptAt || Number.isNaN(attemptAt.getTime())) return 'reconcile';
  const attemptAge = now.getTime() - attemptAt.getTime();
  if (attemptAge > REVIEW_REQUEST_SAFE_RETRY_MS) return 'reconcile';
  if (!input.claimedAt || Number.isNaN(input.claimedAt.getTime())) return 'retry';
  const claimAge = now.getTime() - input.claimedAt.getTime();
  if (claimAge <= REVIEW_REQUEST_CLAIM_STALE_MS) return 'in_flight';
  return 'retry';
}

export function claimableReviewRequestWhere(now = new Date()) {
  const staleBefore = new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS);
  const retryNotBefore = new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS);
  return {
    sentAt: null,
    scheduledFor: { lte: now },
    OR: [
      { sendStatus: null, firstProviderAttemptAt: null },
      {
        sendStatus: 'FAILED',
        firstProviderAttemptAt: { gte: retryNotBefore },
      },
      {
        sendStatus: 'CLAIMED',
        claimedAt: { lt: staleBefore },
        firstProviderAttemptAt: { gte: retryNotBefore },
      },
    ],
  };
}

/** Rows whose idempotency key can no longer be retried, including legacy claims with no attempt timestamp. */
export function expiredReviewClaimWhere(now = new Date()) {
  const expiredBefore = new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS);
  return {
    sentAt: null,
    OR: [
      { sendStatus: 'CLAIMED', firstProviderAttemptAt: null },
      { sendStatus: 'FAILED', firstProviderAttemptAt: null },
      { sendStatus: 'CLAIMED', firstProviderAttemptAt: { lt: expiredBefore } },
      { sendStatus: 'FAILED', firstProviderAttemptAt: { lt: expiredBefore } },
    ],
  };
}

export async function parkExpiredReviewClaims(now = new Date()): Promise<number> {
  const parked = await prisma.reviewRequest.updateMany({
    where: expiredReviewClaimWhere(now),
    data: {
      sendStatus: 'UNKNOWN',
      sendError:
        'Claim is outside the Resend idempotency window. Held for manual reconciliation.',
    },
  });
  return parked.count;
}

export async function claimReviewRequestSend(
  reviewRequestId: string,
  now = new Date()
): Promise<{ claimedAt: Date } | null> {
  const staleBefore = new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS);
  const retryNotBefore = new Date(now.getTime() - REVIEW_REQUEST_SAFE_RETRY_MS);
  const initial = await prisma.reviewRequest.updateMany({
    where: {
      id: reviewRequestId,
      sentAt: null,
      sendStatus: null,
      firstProviderAttemptAt: null,
    },
    data: {
      sendStatus: 'CLAIMED',
      claimedAt: now,
      firstProviderAttemptAt: now,
      sendError: null,
    },
  });
  if (initial.count === 1) return { claimedAt: now };

  const retry = await prisma.reviewRequest.updateMany({
    where: {
      id: reviewRequestId,
      sentAt: null,
      firstProviderAttemptAt: { gte: retryNotBefore },
      OR: [
        { sendStatus: 'FAILED' },
        { sendStatus: 'CLAIMED', claimedAt: { lt: staleBefore } },
      ],
    },
    data: {
      sendStatus: 'CLAIMED',
      claimedAt: now,
      sendError: null,
    },
  });
  if (retry.count !== 1) return null;
  return { claimedAt: now };
}

async function recordOwnedOutcome(
  reviewRequestId: string,
  claimedAt: Date,
  data: {
    sendStatus: 'ACCEPTED' | 'FAILED' | 'UNKNOWN';
    providerMessageId?: string | null;
    sendError?: string | null;
    sentAt?: Date | null;
    claimedAt?: Date | null;
  }
): Promise<boolean> {
  const recorded = await prisma.reviewRequest.updateMany({
    where: {
      id: reviewRequestId,
      sendStatus: 'CLAIMED',
      claimedAt,
    },
    data,
  });
  return recorded.count === 1;
}

export async function deliverClaimedReviewRequest(input: {
  id: string;
  toEmail: string;
  toName: string;
  reviewUrl: string;
  now?: Date;
  send?: (params: {
    toEmail: string;
    toName: string;
    reviewUrl: string;
    idempotencyKey: string;
  }) => Promise<SendReviewRequestEmailResult>;
}): Promise<ReviewRequestDeliveryOutcome> {
  const now = input.now ?? new Date();
  const claim = await claimReviewRequestSend(input.id, now);
  if (!claim) return 'not_claimed';

  const send = input.send ?? sendReviewRequestEmail;
  const idempotencyKey = reviewRequestIdempotencyKey(input.id);
  let result: SendReviewRequestEmailResult;
  try {
    result = await send({
      toEmail: input.toEmail,
      toName: input.toName,
      reviewUrl: input.reviewUrl,
      idempotencyKey,
    });
  } catch (error) {
    const recorded = await recordOwnedOutcome(input.id, claim.claimedAt, {
      sendStatus: 'UNKNOWN',
      sendError: (error instanceof Error ? error.message : 'Send threw before a result').slice(0, 500),
    });
    return recorded ? 'unknown' : 'superseded';
  }

  if (result.sent && result.id) {
    const recorded = await recordOwnedOutcome(input.id, claim.claimedAt, {
      sendStatus: 'ACCEPTED',
      providerMessageId: result.id,
      sendError: null,
      sentAt: new Date(),
    });
    return recorded ? 'sent' : 'accepted_unrecorded';
  }

  const outcomeUnknown = result.outcomeUnknown === true || (result.sent && !result.id);
  if (outcomeUnknown) {
    const recorded = await recordOwnedOutcome(input.id, claim.claimedAt, {
      sendStatus: 'UNKNOWN',
      sendError: (result.error || 'Provider outcome unknown after the send call').slice(0, 500),
    });
    return recorded ? 'unknown' : 'superseded';
  }

  const recorded = await recordOwnedOutcome(input.id, claim.claimedAt, {
    sendStatus: 'FAILED',
    sendError: (result.error || result.skippedReason || 'Send failed').slice(0, 500),
    claimedAt: null,
  });
  if (!recorded) return 'superseded';
  return result.skippedReason ? 'skipped' : 'failed';
}
