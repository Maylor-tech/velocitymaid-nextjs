import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  isTipPaidOut,
  isTipPending,
  isTipReceived,
  receivedStatusForBeneficiary,
} from '@/lib/tips/statuses';

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
    }
  | { ok: false; status: number; error: string; code: string };

/**
 * Idempotently mark a tip RECEIVED / RECEIVED_UNATTRIBUTED.
 * Never changes beneficiaryCleanerId. Never touches JobPayout.
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
    },
  });

  if (!tip) {
    return { ok: false, status: 404, error: 'Tip not found', code: 'NOT_FOUND' };
  }

  if (input.stripeEventId && tip.stripeEventId === input.stripeEventId) {
    return {
      ok: true,
      tipId: tip.id,
      status: tip.status,
      alreadyReceived: true,
    };
  }

  if (input.stripeEventId) {
    const existingEvent = await prisma.tip.findFirst({
      where: { stripeEventId: input.stripeEventId },
      select: { id: true, status: true },
    });
    if (existingEvent) {
      return {
        ok: true,
        tipId: existingEvent.id,
        status: existingEvent.status,
        alreadyReceived: true,
      };
    }
  }

  if (isTipPaidOut(tip.status) || isTipReceived(tip.status)) {
    return {
      ok: true,
      tipId: tip.id,
      status: tip.status,
      alreadyReceived: true,
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
    },
    select: { id: true, status: true },
  });

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
  };
}
