import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  isTipPaidOut,
  isTipPayable,
  isTipSettlementBlockedByDispute,
  normalizeTipStatus,
} from '@/lib/tips/statuses';

export type MarkTipPaidOutInput = {
  tipId: string;
  adminId: string;
  paidOutMethod: string;
  payoutReference?: string | null;
  paidOutAt?: Date;
};

export type MarkTipPaidOutResult =
  | {
      ok: true;
      tipId: string;
      status: 'PAID_OUT';
      alreadyPaidOut: boolean;
      /** Explicit: this API records external settlement only. */
      fundsTransferredByApi: false;
    }
  | { ok: false; status: number; error: string; code: string };

/**
 * Manual tip settlement recording. Separate from JobPayout.
 * Does NOT transfer money — Ops must already have paid the cleaner externally.
 */
export async function markTipPaidOut(
  input: MarkTipPaidOutInput
): Promise<MarkTipPaidOutResult> {
  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    select: {
      id: true,
      status: true,
      beneficiaryCleanerId: true,
      amount: true,
      paidOutAt: true,
      receivedAt: true,
      refundedAt: true,
      disputeStatus: true,
      needsReconcile: true,
      paymentMethod: true,
      stripePaymentIntentId: true,
      providerReference: true,
    },
  });

  if (!tip) {
    return { ok: false, status: 404, error: 'Tip not found', code: 'NOT_FOUND' };
  }

  if (isTipPaidOut(tip.status)) {
    return {
      ok: true,
      tipId: tip.id,
      status: 'PAID_OUT',
      alreadyPaidOut: true,
      fundsTransferredByApi: false,
    };
  }

  const normalized = normalizeTipStatus(tip.status);

  if (normalized === 'PENDING') {
    return {
      ok: false,
      status: 409,
      error: 'Cannot settle a PENDING tip — payment is not confirmed.',
      code: 'NOT_RECEIVED',
    };
  }
  if (normalized === 'FAILED') {
    return {
      ok: false,
      status: 409,
      error: 'Cannot settle a FAILED tip.',
      code: 'FAILED',
    };
  }
  if (normalized === 'REFUNDED' || tip.refundedAt) {
    return {
      ok: false,
      status: 409,
      error: 'Cannot settle a refunded tip.',
      code: 'REFUNDED',
    };
  }
  if (isTipSettlementBlockedByDispute(tip.disputeStatus)) {
    return {
      ok: false,
      status: 409,
      error:
        tip.disputeStatus === 'OPEN'
          ? 'Cannot settle while a dispute is open.'
          : 'Cannot settle a tip with a lost dispute.',
      code: 'DISPUTE_BLOCK',
    };
  }
  if (normalized === 'RECEIVED_UNATTRIBUTED' || !tip.beneficiaryCleanerId) {
    return {
      ok: false,
      status: 409,
      error:
        'Tip has no beneficiary; cannot settle until beneficiary is resolved.',
      code: 'NO_BENEFICIARY',
    };
  }
  if (normalized !== 'RECEIVED') {
    return {
      ok: false,
      status: 409,
      error: `Only RECEIVED (payable) tips can be marked PAID_OUT (current: ${tip.status}).`,
      code: 'INVALID_STATUS',
    };
  }
  if (!tip.receivedAt) {
    return {
      ok: false,
      status: 409,
      error: 'Tip has no confirmed receipt timestamp.',
      code: 'NOT_RECEIVED',
    };
  }
  // Stripe tips must have a PaymentIntent / provider reference confirming collection
  if (tip.paymentMethod === 'STRIPE' && !tip.stripePaymentIntentId) {
    return {
      ok: false,
      status: 409,
      error: 'Stripe tip has no PaymentIntent reference — unsafe to settle.',
      code: 'UNCONFIRMED_PAYMENT',
    };
  }
  if (
    tip.paymentMethod === 'ZELLE' ||
    tip.paymentMethod === 'MANUAL'
  ) {
    // Admin confirm-received sets receivedAt — already required above
  }
  if (tip.needsReconcile) {
    return {
      ok: false,
      status: 409,
      error:
        'Tip is flagged for reconciliation — resolve the mismatch before settling.',
      code: 'NEEDS_RECONCILE',
    };
  }
  if (
    !isTipPayable({
      status: tip.status,
      beneficiaryCleanerId: tip.beneficiaryCleanerId,
      disputeStatus: tip.disputeStatus,
      refundedAt: tip.refundedAt,
      needsReconcile: tip.needsReconcile,
    })
  ) {
    return {
      ok: false,
      status: 409,
      error: 'Tip is not currently payable.',
      code: 'NOT_PAYABLE',
    };
  }

  const method = input.paidOutMethod.trim().toUpperCase();
  if (!method) {
    return {
      ok: false,
      status: 400,
      error: 'paidOutMethod is required (records external payment method only).',
      code: 'INVALID_METHOD',
    };
  }

  const paidOutAt = input.paidOutAt ?? new Date();

  await prisma.tip.update({
    where: { id: tip.id },
    data: {
      status: 'PAID_OUT',
      paidOutAt,
      paidOutByAdminId: input.adminId,
      paidOutMethod: method,
      payoutReference: input.payoutReference?.trim() || null,
    },
  });

  await logAuditEntry({
    actorId: input.adminId,
    actorRole: 'ADMIN',
    action: 'TIP_PAID_OUT',
    entityType: 'Tip',
    entityId: tip.id,
    description: `Tip marked PAID_OUT (external settlement recorded via ${method}) — API did not transfer funds`,
    changes: {
      previousStatus: tip.status,
      newStatus: 'PAID_OUT',
      amountCents: tip.amount,
      beneficiaryCleanerId: tip.beneficiaryCleanerId,
      paidOutMethod: method,
      payoutReference: input.payoutReference?.trim() || null,
      fundsTransferredByApi: false,
    },
  });

  return {
    ok: true,
    tipId: tip.id,
    status: 'PAID_OUT',
    alreadyPaidOut: false,
    fundsTransferredByApi: false,
  };
}
