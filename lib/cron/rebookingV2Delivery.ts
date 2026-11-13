import { prisma } from '@/lib/prisma';
import {
  sendBuiltRebookingReminder,
  type RebookingProviderRequest,
  type SendRebookingReminderEmailResult,
} from '@/lib/email/cronAutomationEmails';
import {
  REBOOKING_CLAIM_STALE_MS,
  REBOOKING_SAFE_RETRY_MS,
  rebookingReminderIdempotencyKey,
  type RebookingDeliveryOutcome,
} from '@/lib/cron/rebookingReminderClaim';
import {
  rebookingDenialReason,
  type RebookingAuthorization,
  type RebookingAuthorizationReason,
} from '@/lib/cron/rebookingExecutionControl';

const MISSING_FINGERPRINT =
  'No trustworthy original payload fingerprint. Held for reconciliation.';
const CHANGED_PAYLOAD =
  'Provider payload changed since the first attempt. Held for reconciliation.';

export type RebookingV2Outcome =
  | RebookingDeliveryOutcome
  | { outcome: 'authorization_revoked'; reason: RebookingAuthorizationReason }
  | 'payload_mismatch'
  | 'fingerprint_missing';

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
 * The last authorization read and the provider call are not one transaction.
 * A revocation that lands after this function has already called the provider
 * cannot recall that external request. The ledger then records the provider
 * result, or UNKNOWN when the result itself is uncertain.
 */
export async function deliverAuthorizedRebookingReminder(input: {
  jobId: string;
  request: RebookingProviderRequest;
  fingerprint: string;
  now?: Date;
  authorize: () => Promise<RebookingAuthorization>;
  send?: (request: RebookingProviderRequest) => Promise<SendRebookingReminderEmailResult>;
}): Promise<RebookingV2Outcome> {
  const now = input.now ?? new Date();
  const beforeClaim = await input.authorize();
  const beforeClaimDenial = rebookingDenialReason(beforeClaim);
  if (beforeClaimDenial) return { outcome: 'authorization_revoked', reason: beforeClaimDenial };
  if (input.request.idempotencyKey !== rebookingReminderIdempotencyKey(input.jobId)) {
    return 'fingerprint_missing';
  }
  if (input.request.idempotencyKey.length < 1 || input.request.idempotencyKey.length > 256) {
    return 'fingerprint_missing';
  }

  const claim = await claimFirstFingerprint(input.jobId, input.fingerprint, now);
  if (claim.kind === 'terminal') return 'skipped';
  if (claim.kind === 'missing') return 'fingerprint_missing';
  if (claim.kind === 'mismatch') return 'payload_mismatch';
  if (claim.kind === 'not_claimed') return 'not_claimed';

  const beforeSend = await input.authorize();
  const beforeSendDenial = rebookingDenialReason(beforeSend);
  if (beforeSendDenial) return { outcome: 'authorization_revoked', reason: beforeSendDenial };

  const send = input.send ?? sendBuiltRebookingReminder;
  let result: SendRebookingReminderEmailResult;
  try {
    result = await send(input.request);
  } catch (error) {
    await recordOwned(input.jobId, claim.claimedAt, {
      status: 'UNKNOWN',
      sendError: (error instanceof Error ? error.message : 'Send threw before a result').slice(0, 500),
    });
    return 'unknown';
  }

  if (result.sent && result.id) {
    const recorded = await recordOwned(input.jobId, claim.claimedAt, {
      status: 'ACCEPTED',
      providerMessageId: result.id,
      sendError: null,
    });
    return recorded ? 'sent' : 'accepted_unrecorded';
  }

  const outcomeUnknown = result.outcomeUnknown === true || (result.sent && !result.id);
  if (outcomeUnknown) {
    await recordOwned(input.jobId, claim.claimedAt, {
      status: 'UNKNOWN',
      sendError: (result.error || 'Provider outcome unknown after the send call').slice(0, 500),
    });
    return 'unknown';
  }

  const recorded = await recordOwned(input.jobId, claim.claimedAt, {
    status: 'FAILED',
    sendError: (result.error || result.skippedReason || 'Send failed').slice(0, 500),
    claimedAt: null,
  });
  if (!recorded) return 'unknown';
  return result.skippedReason ? 'skipped' : 'failed';
}

async function recordOwned(
  jobId: string,
  claimedAt: Date,
  data: {
    status: 'ACCEPTED' | 'FAILED' | 'UNKNOWN';
    providerMessageId?: string | null;
    sendError?: string | null;
    claimedAt?: Date | null;
  }
): Promise<boolean> {
  try {
    const recorded = await prisma.rebookingReminderDelivery.updateMany({
      where: { jobId, status: 'CLAIMED', claimedAt },
      data,
    });
    return recorded.count === 1;
  } catch {
    return false;
  }
}

type ClaimResult =
  | { kind: 'claimed'; claimedAt: Date }
  | { kind: 'terminal' }
  | { kind: 'missing' }
  | { kind: 'mismatch' }
  | { kind: 'not_claimed' };

async function claimFirstFingerprint(jobId: string, fingerprint: string, now: Date): Promise<ClaimResult> {
  try {
    await prisma.rebookingReminderDelivery.create({
      data: {
        jobId,
        status: 'CLAIMED',
        claimedAt: now,
        firstProviderAttemptAt: now,
        payloadFingerprint: fingerprint,
      },
    });
    return { kind: 'claimed', claimedAt: now };
  } catch (error) {
    if (prismaCode(error) !== 'P2002') throw error;
  }

  const existing = await prisma.rebookingReminderDelivery.findUnique({
    where: { jobId },
    select: { status: true, payloadFingerprint: true, firstProviderAttemptAt: true },
  });
  if (!existing) return { kind: 'not_claimed' };
  if (existing.status === 'ACCEPTED' || existing.status === 'UNKNOWN') return { kind: 'terminal' };

  const owned = {
    jobId,
    firstProviderAttemptAt: { gte: retryNotBefore(now) },
    OR: [
      { status: 'FAILED' },
      { status: 'CLAIMED', claimedAt: { lt: staleBefore(now) } },
    ],
  };

  if (!existing.payloadFingerprint) {
    const held = await prisma.rebookingReminderDelivery.updateMany({
      where: { ...owned, payloadFingerprint: null },
      data: { status: 'UNKNOWN', sendError: MISSING_FINGERPRINT },
    });
    return held.count === 1 ? { kind: 'missing' } : { kind: 'not_claimed' };
  }

  if (existing.payloadFingerprint !== fingerprint) {
    const held = await prisma.rebookingReminderDelivery.updateMany({
      where: { ...owned, payloadFingerprint: existing.payloadFingerprint },
      data: { status: 'UNKNOWN', sendError: CHANGED_PAYLOAD },
    });
    return held.count === 1 ? { kind: 'mismatch' } : { kind: 'not_claimed' };
  }

  const retry = await prisma.rebookingReminderDelivery.updateMany({
    where: { ...owned, payloadFingerprint: fingerprint },
    data: { status: 'CLAIMED', claimedAt: now, sendError: null },
  });
  if (retry.count !== 1) return { kind: 'not_claimed' };
  return { kind: 'claimed', claimedAt: now };
}
