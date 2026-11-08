import { prisma } from '@/lib/prisma';
import {
  sendReviewRequestEmail,
  type SendReviewRequestEmailResult,
} from '@/lib/email/sendReviewRequestEmail';

/** A crashed claim can be retried with the same provider idempotency key. */
export const REVIEW_REQUEST_CLAIM_STALE_MS = 15 * 60 * 1000;

export type ReviewRequestDeliveryOutcome =
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'unknown'
  | 'accepted_unrecorded'
  | 'not_claimed';

export function reviewRequestIdempotencyKey(reviewRequestId: string): string {
  return `review-request-${reviewRequestId}`;
}

export function claimableReviewRequestWhere(now = new Date()) {
  const staleBefore = new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS);
  return {
    sentAt: null,
    scheduledFor: { lte: now },
    OR: [
      { sendStatus: null },
      { sendStatus: 'FAILED' },
      { sendStatus: 'CLAIMED', claimedAt: { lt: staleBefore } },
    ],
  };
}

/**
 * Conditional claim. A second worker sees count 0 and must not send.
 * ACCEPTED and UNKNOWN stay claimed so a provider acceptance is not resent
 * merely because sentAt was not written.
 */
export async function claimReviewRequestSend(
  reviewRequestId: string,
  now = new Date()
): Promise<boolean> {
  const staleBefore = new Date(now.getTime() - REVIEW_REQUEST_CLAIM_STALE_MS);
  const claimed = await prisma.reviewRequest.updateMany({
    where: {
      id: reviewRequestId,
      sentAt: null,
      OR: [
        { sendStatus: null },
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
  return claimed.count === 1;
}

async function recordOutcome(
  reviewRequestId: string,
  data: {
    sendStatus: 'ACCEPTED' | 'FAILED' | 'UNKNOWN';
    providerMessageId?: string | null;
    sendError?: string | null;
    sentAt?: Date | null;
    claimedAt?: Date | null;
  }
): Promise<boolean> {
  try {
    await prisma.reviewRequest.update({
      where: { id: reviewRequestId },
      data,
    });
    return true;
  } catch (error) {
    console.error('[review-request] outcome was not recorded', {
      reviewRequestId,
      sendStatus: data.sendStatus,
      message: error instanceof Error ? error.message : 'update failed',
    });
    return false;
  }
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
  const claimed = await claimReviewRequestSend(input.id, input.now);
  if (!claimed) return 'not_claimed';

  const send = input.send ?? sendReviewRequestEmail;
  const result = await send({
    toEmail: input.toEmail,
    toName: input.toName,
    reviewUrl: input.reviewUrl,
    idempotencyKey: reviewRequestIdempotencyKey(input.id),
  });

  if (result.sent && result.id) {
    const recorded = await recordOutcome(input.id, {
      sendStatus: 'ACCEPTED',
      providerMessageId: result.id,
      sendError: null,
      sentAt: new Date(),
    });
    return recorded ? 'sent' : 'accepted_unrecorded';
  }

  const outcomeUnknown = result.outcomeUnknown === true || (result.sent && !result.id);
  if (outcomeUnknown) {
    await recordOutcome(input.id, {
      sendStatus: 'UNKNOWN',
      sendError: (result.error || 'Provider outcome unknown after the send call').slice(0, 500),
    });
    return 'unknown';
  }

  await recordOutcome(input.id, {
    sendStatus: 'FAILED',
    sendError: (result.error || result.skippedReason || 'Send failed').slice(0, 500),
    claimedAt: null,
  });
  return result.skippedReason ? 'skipped' : 'failed';
}
