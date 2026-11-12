import { prisma } from '@/lib/prisma';
import {
  sendRebookingReminderEmail,
  type SendRebookingReminderEmailResult,
} from '@/lib/email/cronAutomationEmails';
import { REBOOKING_REMINDER_ACTION } from '@/lib/cron/rebookingReminders';
import {
  RESEND_IDEMPOTENCY_RETENTION_MS,
  REVIEW_REQUEST_CLAIM_STALE_MS,
  REVIEW_REQUEST_SAFE_RETRY_MS,
} from '@/lib/reviews/reviewRequestClaim';

export const REBOOKING_SAFE_RETRY_MS = REVIEW_REQUEST_SAFE_RETRY_MS;
export const REBOOKING_CLAIM_STALE_MS = REVIEW_REQUEST_CLAIM_STALE_MS;

export type RebookingDeliveryOutcome =
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'unknown'
  | 'accepted_unrecorded'
  | 'superseded'
  | 'not_claimed';

export function rebookingReminderIdempotencyKey(jobId: string): string {
  return `rebooking-reminder-${jobId}`;
}

function retryNotBefore(now: Date): Date {
  return new Date(now.getTime() - REBOOKING_SAFE_RETRY_MS);
}

function staleBefore(now: Date): Date {
  return new Date(now.getTime() - REBOOKING_CLAIM_STALE_MS);
}

function prismaCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/**
 * Record historical sends before any new provider call.
 * An existing claim row wins; this never resets CLAIMED, FAILED, or UNKNOWN.
 */
export async function backfillSentRebookingReminders(): Promise<number> {
  const sent = await prisma.auditLog.findMany({
    where: {
      action: REBOOKING_REMINDER_ACTION,
      entityType: 'Job',
    },
    select: { entityId: true },
    distinct: ['entityId'],
  });

  let inserted = 0;
  for (const row of sent) {
    if (!row.entityId) continue;
    try {
      await prisma.rebookingReminderDelivery.create({
        data: {
          jobId: row.entityId,
          status: 'ACCEPTED',
        },
      });
      inserted += 1;
    } catch (error) {
      const code = prismaCode(error);
      if (code !== 'P2002' && code !== 'P2003') throw error;
    }
  }
  return inserted;
}

export async function parkExpiredRebookingClaims(now = new Date()): Promise<number> {
  const expiredBefore = retryNotBefore(now);
  const parked = await prisma.rebookingReminderDelivery.updateMany({
    where: {
      OR: [
        { status: 'CLAIMED', firstProviderAttemptAt: null },
        { status: 'FAILED', firstProviderAttemptAt: null },
        { status: 'CLAIMED', firstProviderAttemptAt: { lt: expiredBefore } },
        { status: 'FAILED', firstProviderAttemptAt: { lt: expiredBefore } },
      ],
    },
    data: {
      status: 'UNKNOWN',
      sendError:
        'Claim is outside the Resend idempotency window. Held for manual reconciliation.',
    },
  });
  return parked.count;
}

export async function claimRebookingReminder(
  jobId: string,
  now = new Date()
): Promise<{ claimedAt: Date } | null> {
  try {
    await prisma.rebookingReminderDelivery.create({
      data: {
        jobId,
        status: 'CLAIMED',
        claimedAt: now,
        firstProviderAttemptAt: now,
      },
    });
    return { claimedAt: now };
  } catch (error) {
    if (prismaCode(error) !== 'P2002') throw error;
  }

  const retry = await prisma.rebookingReminderDelivery.updateMany({
    where: {
      jobId,
      firstProviderAttemptAt: { gte: retryNotBefore(now) },
      OR: [
        { status: 'FAILED' },
        { status: 'CLAIMED', claimedAt: { lt: staleBefore(now) } },
      ],
    },
    data: {
      status: 'CLAIMED',
      claimedAt: now,
      sendError: null,
    },
  });
  if (retry.count !== 1) return null;
  return { claimedAt: now };
}

async function recordOwnedOutcome(
  jobId: string,
  claimedAt: Date,
  data: {
    status: 'ACCEPTED' | 'FAILED' | 'UNKNOWN';
    providerMessageId?: string | null;
    sendError?: string | null;
    claimedAt?: Date | null;
  }
): Promise<boolean> {
  const recorded = await prisma.rebookingReminderDelivery.updateMany({
    where: {
      jobId,
      status: 'CLAIMED',
      claimedAt,
    },
    data,
  });
  return recorded.count === 1;
}

export async function deliverClaimedRebookingReminder(input: {
  jobId: string;
  toEmail: string;
  hostFirstName: string;
  propertyAddress: string;
  checkoutDate: Date;
  now?: Date;
  send?: (params: {
    toEmail: string;
    hostFirstName: string;
    propertyAddress: string;
    checkoutDate: Date;
    idempotencyKey: string;
  }) => Promise<SendRebookingReminderEmailResult>;
}): Promise<RebookingDeliveryOutcome> {
  const now = input.now ?? new Date();
  const claim = await claimRebookingReminder(input.jobId, now);
  if (!claim) return 'not_claimed';

  const send = input.send ?? sendRebookingReminderEmail;
  const idempotencyKey = rebookingReminderIdempotencyKey(input.jobId);
  let result: SendRebookingReminderEmailResult;
  try {
    result = await send({
      toEmail: input.toEmail,
      hostFirstName: input.hostFirstName,
      propertyAddress: input.propertyAddress,
      checkoutDate: input.checkoutDate,
      idempotencyKey,
    });
  } catch (error) {
    const recorded = await recordOwnedOutcome(input.jobId, claim.claimedAt, {
      status: 'UNKNOWN',
      sendError: (error instanceof Error ? error.message : 'Send threw before a result').slice(0, 500),
    });
    return recorded ? 'unknown' : 'superseded';
  }

  if (result.sent && result.id) {
    const recorded = await recordOwnedOutcome(input.jobId, claim.claimedAt, {
      status: 'ACCEPTED',
      providerMessageId: result.id,
      sendError: null,
    });
    return recorded ? 'sent' : 'accepted_unrecorded';
  }

  const outcomeUnknown = result.outcomeUnknown === true || (result.sent && !result.id);
  if (outcomeUnknown) {
    const recorded = await recordOwnedOutcome(input.jobId, claim.claimedAt, {
      status: 'UNKNOWN',
      sendError: (result.error || 'Provider outcome unknown after the send call').slice(0, 500),
    });
    return recorded ? 'unknown' : 'superseded';
  }

  const recorded = await recordOwnedOutcome(input.jobId, claim.claimedAt, {
    status: 'FAILED',
    sendError: (result.error || result.skippedReason || 'Send failed').slice(0, 500),
    claimedAt: null,
  });
  if (!recorded) return 'superseded';
  return result.skippedReason ? 'skipped' : 'failed';
}

export { RESEND_IDEMPOTENCY_RETENTION_MS };
