import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { resolveSafeWhatsAppRecipient } from '@/lib/notifications/outboundSafety';
import type { WhatsAppSendResult } from '@/lib/whatsapp/sendMessage';

export const REFERRAL_NUDGE_SENT = 'REFERRAL_NUDGE_SENT';
export const REFERRAL_NUDGE_CLAIM = 'REFERRAL_NUDGE_CLAIM';

/**
 * Rows that must block another referral send.
 * CLAIM stays in place for an in-flight, accepted, or unknown attempt.
 * Historical SENT rows are included so older nudges are not repeated.
 * WhatsApp has no idempotency key, so an uncertain claim is never retried.
 */
export const REFERRAL_NUDGE_BLOCKING_ACTIONS = [
  REFERRAL_NUDGE_SENT,
  REFERRAL_NUDGE_CLAIM,
] as const;

export type ReferralSettlement =
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'unknown'
  | 'accepted_unrecorded';

/** A skip that happens before fetch. These claims may be released. */
export function referralPreSendSkip(to: string): string | null {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return 'whatsapp_not_configured';
  }
  const safety = resolveSafeWhatsAppRecipient(to);
  if (!safety.allowed || !safety.to) return safety.reason;
  return null;
}

/**
 * accepted: provider returned a message id.
 * release: definite pre-send skip or a 4xx rejection. The claim may be deleted.
 * unknown: the provider may already have accepted. Keep the claim.
 */
export function referralSendDisposition(
  result: WhatsAppSendResult
): 'accepted' | 'release' | 'unknown' {
  if (result.status === 'accepted' && result.providerMessageId) return 'accepted';
  if (result.status === 'skipped' || result.status === 'failed') return 'release';
  return 'unknown';
}

export async function openReferralClaim(jobId: string): Promise<string | null> {
  return logAuditEntry({
    action: REFERRAL_NUDGE_CLAIM,
    entityType: 'Job',
    entityId: jobId,
    description: 'Referral nudge claimed before the WhatsApp provider call',
    changes: { status: 'claimed' },
  });
}

const ownedClaimWhere = (claimId: string) => ({
  id: claimId,
  action: REFERRAL_NUDGE_CLAIM,
  changes: { path: ['status'], equals: 'claimed' },
});

export async function settleReferralClaim(
  claimId: string,
  result: WhatsAppSendResult
): Promise<ReferralSettlement> {
  const disposition = referralSendDisposition(result);

  if (disposition === 'accepted' && result.providerMessageId) {
    const updated = await prisma.auditLog.updateMany({
      where: ownedClaimWhere(claimId),
      data: {
        description: 'Referral nudge accepted by the WhatsApp provider',
        changes: {
          status: 'accepted',
          deliveryStatus: 'accepted',
          providerMessageId: result.providerMessageId,
          acceptedAt: new Date().toISOString(),
        },
      },
    });
    return updated.count === 1 ? 'sent' : 'accepted_unrecorded';
  }

  if (disposition === 'unknown') {
    await prisma.auditLog.updateMany({
      where: ownedClaimWhere(claimId),
      data: {
        description: 'Referral nudge outcome is unknown and needs reconciliation',
        changes: {
          status: 'unknown',
          deliveryStatus: 'unknown',
          reason: result.reason || 'provider_outcome_unknown',
          requiresReconciliation: true,
        },
      },
    });
    return 'unknown';
  }

  await prisma.auditLog.deleteMany({
    where: ownedClaimWhere(claimId),
  });
  return result.status === 'failed' ? 'failed' : 'skipped';
}
