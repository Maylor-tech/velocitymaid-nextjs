import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  isTipPaidOut,
  isTipPending,
  normalizeTipDisputeStatus,
  normalizeTipStatus,
} from '@/lib/tips/statuses';
import { cancelOwedTipAllocations } from '@/lib/tips/tipAllocation';

export type TipReversalResult =
  | {
      ok: true;
      tipId: string;
      alreadyProcessed: boolean;
      status: string;
      disputeStatus: string;
      needsReconcile: boolean;
    }
  | { ok: false; status: number; error: string; code: string };

async function recordWebhookEvent(input: {
  stripeEventId: string;
  tipId: string | null;
  eventType: string;
  outcome: string;
}): Promise<'NEW' | 'DUPLICATE'> {
  try {
    await prisma.tipWebhookEvent.create({
      data: {
        stripeEventId: input.stripeEventId,
        tipId: input.tipId,
        eventType: input.eventType,
        outcome: input.outcome,
      },
    });
    return 'NEW';
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : '';
    if (code === 'P2002') return 'DUPLICATE';
    throw err;
  }
}

export async function findTipByPaymentIntentId(
  paymentIntentId: string | null | undefined
): Promise<{ id: string } | null> {
  if (!paymentIntentId) return null;
  return prisma.tip.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  });
}

/**
 * Full refund before or after settlement.
 * Before PAID_OUT → status REFUNDED (no longer payable).
 * After PAID_OUT → keep PAID_OUT, set refundedAt + needsReconcile.
 */
export async function applyTipFullRefund(input: {
  tipId: string;
  stripeEventId: string;
  eventType: string;
  refundedAt?: Date;
}): Promise<TipReversalResult> {
  const existing = await prisma.tipWebhookEvent.findUnique({
    where: { stripeEventId: input.stripeEventId },
    select: { tipId: true, outcome: true },
  });
  if (existing) {
    const tip = await prisma.tip.findUnique({
      where: { id: input.tipId },
      select: {
        id: true,
        status: true,
        disputeStatus: true,
        needsReconcile: true,
      },
    });
    return {
      ok: true,
      tipId: input.tipId,
      alreadyProcessed: true,
      status: tip?.status || 'UNKNOWN',
      disputeStatus: tip?.disputeStatus || 'NONE',
      needsReconcile: Boolean(tip?.needsReconcile),
    };
  }

  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    select: {
      id: true,
      status: true,
      beneficiaryCleanerId: true,
      amount: true,
      refundedAt: true,
      disputeStatus: true,
      needsReconcile: true,
    },
  });
  if (!tip) {
    await recordWebhookEvent({
      stripeEventId: input.stripeEventId,
      tipId: null,
      eventType: input.eventType,
      outcome: 'NO_MATCH',
    });
    return { ok: false, status: 404, error: 'Tip not found', code: 'NOT_FOUND' };
  }

  const paidOut = isTipPaidOut(tip.status);
  const alreadyRefunded =
    tip.refundedAt != null || normalizeTipStatus(tip.status) === 'REFUNDED';
  const refundedAt = input.refundedAt ?? new Date();

  if (alreadyRefunded && !paidOut) {
    await recordWebhookEvent({
      stripeEventId: input.stripeEventId,
      tipId: tip.id,
      eventType: input.eventType,
      outcome: 'DUPLICATE',
    });
    return {
      ok: true,
      tipId: tip.id,
      alreadyProcessed: true,
      status: tip.status,
      disputeStatus: tip.disputeStatus,
      needsReconcile: tip.needsReconcile,
    };
  }

  const paidAllocations = await prisma.tipAllocation.count({
    where: { tipId: tip.id, status: 'PAID_OUT' },
  });

  if (paidOut || paidAllocations > 0) {
    await cancelOwedTipAllocations({
      tipId: tip.id,
      reason: 'refund_after_partial_or_full_settlement',
    });
    await prisma.tip.update({
      where: { id: tip.id },
      data: {
        refundedAt,
        needsReconcile: true,
        reconcileReason: 'REFUND_AFTER_PAID_OUT',
        // Preserve PAID_OUT / partial allocation history — never silently debit
      },
    });
  } else {
    await cancelOwedTipAllocations({
      tipId: tip.id,
      reason: 'refund_before_allocation_payout',
    });
    await prisma.tip.update({
      where: { id: tip.id },
      data: {
        status: 'REFUNDED',
        refundedAt,
        // Clear payable path; keep beneficiary frozen for audit
      },
    });
  }

  await recordWebhookEvent({
    stripeEventId: input.stripeEventId,
    tipId: tip.id,
    eventType: input.eventType,
    outcome: 'PROCESSED',
  });

  await logAuditEntry({
    actorRole: 'SYSTEM',
    action: 'TIP_REFUNDED',
    entityType: 'Tip',
    entityId: tip.id,
    description: paidOut
      ? 'Tip refunded after PAID_OUT — marked needsReconcile'
      : 'Tip fully refunded before payout',
    changes: {
      previousStatus: tip.status,
      newStatus: paidOut ? tip.status : 'REFUNDED',
      paidOutPreserved: paidOut,
      needsReconcile: paidOut,
      amountCents: tip.amount,
      stripeEventId: input.stripeEventId,
    },
  });

  const updated = await prisma.tip.findUnique({
    where: { id: tip.id },
    select: {
      status: true,
      disputeStatus: true,
      needsReconcile: true,
    },
  });

  return {
    ok: true,
    tipId: tip.id,
    alreadyProcessed: false,
    status: updated?.status || tip.status,
    disputeStatus: updated?.disputeStatus || tip.disputeStatus,
    needsReconcile: Boolean(updated?.needsReconcile),
  };
}

/**
 * Dispute opened — block settlement; preserve PAID_OUT if already settled.
 */
export async function applyTipDisputeOpened(input: {
  tipId: string;
  stripeEventId: string;
  eventType: string;
  disputedAt?: Date;
}): Promise<TipReversalResult> {
  const existing = await prisma.tipWebhookEvent.findUnique({
    where: { stripeEventId: input.stripeEventId },
  });
  if (existing) {
    const tip = await prisma.tip.findUnique({
      where: { id: input.tipId },
      select: {
        status: true,
        disputeStatus: true,
        needsReconcile: true,
      },
    });
    return {
      ok: true,
      tipId: input.tipId,
      alreadyProcessed: true,
      status: tip?.status || 'UNKNOWN',
      disputeStatus: tip?.disputeStatus || 'OPEN',
      needsReconcile: Boolean(tip?.needsReconcile),
    };
  }

  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    select: {
      id: true,
      status: true,
      disputeStatus: true,
      amount: true,
      needsReconcile: true,
    },
  });
  if (!tip) {
    await recordWebhookEvent({
      stripeEventId: input.stripeEventId,
      tipId: null,
      eventType: input.eventType,
      outcome: 'NO_MATCH',
    });
    return { ok: false, status: 404, error: 'Tip not found', code: 'NOT_FOUND' };
  }

  const paidOut = isTipPaidOut(tip.status);
  const disputedAt = input.disputedAt ?? new Date();

  await prisma.tip.update({
    where: { id: tip.id },
    data: {
      disputeStatus: 'OPEN',
      disputedAt,
      ...(paidOut
        ? {
            needsReconcile: true,
            reconcileReason: 'DISPUTE_AFTER_PAID_OUT',
          }
        : {}),
    },
  });

  await recordWebhookEvent({
    stripeEventId: input.stripeEventId,
    tipId: tip.id,
    eventType: input.eventType,
    outcome: 'PROCESSED',
  });

  await logAuditEntry({
    actorRole: 'SYSTEM',
    action: 'TIP_DISPUTE_OPENED',
    entityType: 'Tip',
    entityId: tip.id,
    description: paidOut
      ? 'Dispute opened after PAID_OUT — needsReconcile'
      : 'Dispute opened — settlement blocked',
    changes: {
      previousDisputeStatus: tip.disputeStatus,
      disputeStatus: 'OPEN',
      statusPreserved: tip.status,
      amountCents: tip.amount,
      stripeEventId: input.stripeEventId,
    },
  });

  return {
    ok: true,
    tipId: tip.id,
    alreadyProcessed: false,
    status: tip.status,
    disputeStatus: 'OPEN',
    needsReconcile: paidOut || tip.needsReconcile,
  };
}

/**
 * Dispute closed. Won → clear block (back to payable if RECEIVED).
 * Lost → REFUNDED if not PAID_OUT; else needsReconcile.
 */
export async function applyTipDisputeClosed(input: {
  tipId: string;
  stripeEventId: string;
  eventType: string;
  /** Stripe dispute status: won | lost | warning_closed | … */
  stripeDisputeStatus: string;
  closedAt?: Date;
}): Promise<TipReversalResult> {
  const existing = await prisma.tipWebhookEvent.findUnique({
    where: { stripeEventId: input.stripeEventId },
  });
  if (existing) {
    const tip = await prisma.tip.findUnique({
      where: { id: input.tipId },
      select: {
        status: true,
        disputeStatus: true,
        needsReconcile: true,
      },
    });
    return {
      ok: true,
      tipId: input.tipId,
      alreadyProcessed: true,
      status: tip?.status || 'UNKNOWN',
      disputeStatus: tip?.disputeStatus || 'NONE',
      needsReconcile: Boolean(tip?.needsReconcile),
    };
  }

  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    select: {
      id: true,
      status: true,
      disputeStatus: true,
      amount: true,
      needsReconcile: true,
      refundedAt: true,
    },
  });
  if (!tip) {
    await recordWebhookEvent({
      stripeEventId: input.stripeEventId,
      tipId: null,
      eventType: input.eventType,
      outcome: 'NO_MATCH',
    });
    return { ok: false, status: 404, error: 'Tip not found', code: 'NOT_FOUND' };
  }

  const paidOut = isTipPaidOut(tip.status);
  const closedAt = input.closedAt ?? new Date();
  const stripeStatus = input.stripeDisputeStatus.toLowerCase();
  // Stripe dispute.status: won | lost | warning_closed | …
  const isWon =
    stripeStatus === 'won' || stripeStatus === 'warning_closed';
  const isLost = stripeStatus === 'lost';

  if (isWon) {
    await prisma.tip.update({
      where: { id: tip.id },
      data: {
        disputeStatus: 'WON',
        disputeClosedAt: closedAt,
        // If still RECEIVED, payable again. Do not clear PAID_OUT reconcile
        // automatically — ops may still need to review funds.
        ...(paidOut
          ? {}
          : {
              // Clear open-dispute block; leave needsReconcile only if set for other reasons
            }),
      },
    });
  } else if (isLost) {
    const paidAllocations = await prisma.tipAllocation.count({
      where: { tipId: tip.id, status: 'PAID_OUT' },
    });
    if (paidOut || paidAllocations > 0) {
      await cancelOwedTipAllocations({
        tipId: tip.id,
        reason: 'dispute_lost_after_partial_or_full_settlement',
      });
      await prisma.tip.update({
        where: { id: tip.id },
        data: {
          disputeStatus: 'LOST',
          disputeClosedAt: closedAt,
          refundedAt: tip.refundedAt ?? closedAt,
          needsReconcile: true,
          reconcileReason: 'DISPUTE_LOST_AFTER_PAID_OUT',
        },
      });
    } else {
      await cancelOwedTipAllocations({
        tipId: tip.id,
        reason: 'dispute_lost_before_allocation_payout',
      });
      await prisma.tip.update({
        where: { id: tip.id },
        data: {
          disputeStatus: 'LOST',
          disputeClosedAt: closedAt,
          status: 'REFUNDED',
          refundedAt: tip.refundedAt ?? closedAt,
        },
      });
    }
  } else {
    // Unknown close status — keep OPEN→ mark closed as LOST-safe hold via reconcile
    await prisma.tip.update({
      where: { id: tip.id },
      data: {
        disputeStatus: normalizeTipDisputeStatus(tip.disputeStatus) === 'OPEN'
          ? 'OPEN'
          : tip.disputeStatus,
        disputeClosedAt: closedAt,
        needsReconcile: true,
        reconcileReason: 'STRIPE_LEDGER_MISMATCH',
      },
    });
  }

  await recordWebhookEvent({
    stripeEventId: input.stripeEventId,
    tipId: tip.id,
    eventType: input.eventType,
    outcome: 'PROCESSED',
  });

  await logAuditEntry({
    actorRole: 'SYSTEM',
    action: 'TIP_DISPUTE_CLOSED',
    entityType: 'Tip',
    entityId: tip.id,
    description: `Tip dispute closed (${input.stripeDisputeStatus})`,
    changes: {
      stripeDisputeStatus: input.stripeDisputeStatus,
      isWon,
      isLost,
      previousStatus: tip.status,
      paidOutPreserved: paidOut,
      stripeEventId: input.stripeEventId,
    },
  });

  const updated = await prisma.tip.findUnique({
    where: { id: tip.id },
    select: {
      status: true,
      disputeStatus: true,
      needsReconcile: true,
    },
  });

  return {
    ok: true,
    tipId: tip.id,
    alreadyProcessed: false,
    status: updated?.status || tip.status,
    disputeStatus: updated?.disputeStatus || tip.disputeStatus,
    needsReconcile: Boolean(updated?.needsReconcile),
  };
}

/** Mark FAILED only from PENDING. */
export async function applyTipPaymentFailed(input: {
  tipId: string;
  stripeEventId?: string;
  eventType?: string;
}): Promise<void> {
  if (input.stripeEventId && input.eventType) {
    const dup = await recordWebhookEvent({
      stripeEventId: input.stripeEventId,
      tipId: input.tipId,
      eventType: input.eventType,
      outcome: 'PROCESSED',
    });
    if (dup === 'DUPLICATE') return;
  }

  await prisma.tip.updateMany({
    where: {
      id: input.tipId,
      status: { in: ['PENDING', 'pending'] },
    },
    data: { status: 'FAILED' },
  });
}

export { isTipPending };
