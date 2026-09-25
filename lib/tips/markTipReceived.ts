import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  isTipPaidOut,
  isTipPending,
  isTipReceived,
  receivedStatusForBeneficiary,
} from '@/lib/tips/statuses';
import { cleanerTipEntitlementCents } from '@/lib/tips/tipPolicy';

export type MarkTipReceivedInput = {
  tipId: string;
  amountCents: number;
  stripeEventId?: string | null;
  providerReference?: string | null;
  confirmedByAdminId?: string | null;
  receivedAt?: Date;
  source: 'STRIPE_WEBHOOK' | 'ADMIN_ZELLE' | 'ADMIN_MANUAL';
};

export type MarkTipReceivedResult =
  | {
      ok: true;
      tipId: string;
      status: string;
      alreadyReceived: boolean;
      entitlementCents: number;
    }
  | { ok: false; status: number; error: string; code: string };

async function recordWebhookEventSafe(input: {
  stripeEventId: string;
  tipId: string | null;
  eventType: string;
  outcome: string;
}): Promise<void> {
  try {
    await prisma.tipWebhookEvent.create({
      data: {
        stripeEventId: input.stripeEventId,
        tipId: input.tipId,
        eventType: input.eventType,
        outcome: input.outcome,
      },
    });
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : '';
    if (code !== 'P2002') throw err;
  }
}

/**
 * Idempotently mark a tip RECEIVED / RECEIVED_UNATTRIBUTED.
 * Never changes beneficiaryCleanerId. Never touches JobPayout.
 * Entitlement = full guest face value (see tipPolicy).
 */
export async function markTipReceived(
  input: MarkTipReceivedInput
): Promise<MarkTipReceivedResult> {
  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    select: {
      id: true,
      amount: true,
      status: true,
      beneficiaryCleanerId: true,
      stripeEventId: true,
      receivedAt: true,
      refundedAt: true,
    },
  });

  if (!tip) {
    return { ok: false, status: 404, error: 'Tip not found', code: 'NOT_FOUND' };
  }

  const entitlementCents = cleanerTipEntitlementCents(tip.amount);

  if (input.stripeEventId && tip.stripeEventId === input.stripeEventId) {
    return {
      ok: true,
      tipId: tip.id,
      status: tip.status,
      alreadyReceived: true,
      entitlementCents,
    };
  }

  if (input.stripeEventId) {
    const existingEvent = await prisma.tip.findFirst({
      where: { stripeEventId: input.stripeEventId },
      select: { id: true, status: true, amount: true },
    });
    if (existingEvent) {
      return {
        ok: true,
        tipId: existingEvent.id,
        status: existingEvent.status,
        alreadyReceived: true,
        entitlementCents: cleanerTipEntitlementCents(existingEvent.amount),
      };
    }
  }

  if (isTipPaidOut(tip.status) || isTipReceived(tip.status)) {
    if (input.stripeEventId) {
      await recordWebhookEventSafe({
        stripeEventId: input.stripeEventId,
        tipId: tip.id,
        eventType: 'payment_intent.succeeded',
        outcome: 'DUPLICATE',
      });
    }
    return {
      ok: true,
      tipId: tip.id,
      status: tip.status,
      alreadyReceived: true,
      entitlementCents,
    };
  }

  if (!isTipPending(tip.status) && tip.status.toLowerCase() !== 'pending') {
    return {
      ok: false,
      status: 409,
      error: `Cannot mark tip received from status ${tip.status}`,
      code: 'INVALID_STATUS',
    };
  }

  if (tip.refundedAt) {
    return {
      ok: false,
      status: 409,
      error: 'Cannot mark a refunded tip as received.',
      code: 'REFUNDED',
    };
  }

  if (input.amountCents !== tip.amount) {
    return {
      ok: false,
      status: 400,
      error: 'Received amount must match the tip amount.',
      code: 'AMOUNT_MISMATCH',
    };
  }

  const nextStatus = receivedStatusForBeneficiary(tip.beneficiaryCleanerId);
  const receivedAt = input.receivedAt ?? new Date();

  const updated = await prisma.tip.update({
    where: { id: tip.id },
    data: {
      status: nextStatus,
      receivedAt,
      stripeEventId: input.stripeEventId ?? undefined,
      providerReference: input.providerReference ?? undefined,
      confirmedByAdminId: input.confirmedByAdminId ?? undefined,
      confirmedAt: input.confirmedByAdminId ? receivedAt : undefined,
      // Clear stale pending-mismatch flag if present
      needsReconcile: false,
      reconcileReason: null,
    },
    select: { id: true, status: true },
  });

  if (input.stripeEventId) {
    await recordWebhookEventSafe({
      stripeEventId: input.stripeEventId,
      tipId: tip.id,
      eventType: 'payment_intent.succeeded',
      outcome: 'PROCESSED',
    });
  }

  await logAuditEntry({
    actorId: input.confirmedByAdminId ?? null,
    actorRole: input.source === 'STRIPE_WEBHOOK' ? 'SYSTEM' : 'ADMIN',
    action: 'TIP_RECEIVED',
    entityType: 'Tip',
    entityId: tip.id,
    description: `Tip marked ${nextStatus} via ${input.source}`,
    changes: {
      previousStatus: tip.status,
      newStatus: nextStatus,
      amountCents: tip.amount,
      entitlementCents,
      platformShareCents: 0,
      beneficiaryCleanerId: tip.beneficiaryCleanerId,
      stripeEventId: input.stripeEventId ?? null,
      providerReference: input.providerReference ?? null,
      source: input.source,
    },
  });

  return {
    ok: true,
    tipId: updated.id,
    status: updated.status,
    alreadyReceived: false,
    entitlementCents,
  };
}
