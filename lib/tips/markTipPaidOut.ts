import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { isTipPaidOut, normalizeTipStatus } from '@/lib/tips/statuses';

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
    }
  | { ok: false; status: number; error: string; code: string };

/**
 * Manual tip settlement. Separate from JobPayout. Does not transfer money.
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
    };
  }

  const normalized = normalizeTipStatus(tip.status);
  if (normalized !== 'RECEIVED') {
    return {
      ok: false,
      status: 409,
      error:
        normalized === 'RECEIVED_UNATTRIBUTED'
          ? 'Unattributed tips cannot be settled to a cleaner until beneficiary is resolved by approved ops.'
          : `Only RECEIVED tips can be marked PAID_OUT (current: ${tip.status}).`,
      code: 'INVALID_STATUS',
    };
  }

  if (!tip.beneficiaryCleanerId) {
    return {
      ok: false,
      status: 409,
      error: 'Tip has no beneficiary; cannot settle.',
      code: 'NO_BENEFICIARY',
    };
  }

  const method = input.paidOutMethod.trim().toUpperCase();
  if (!method) {
    return {
      ok: false,
      status: 400,
      error: 'paidOutMethod is required',
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
    description: `Tip marked PAID_OUT via ${method}`,
    changes: {
      previousStatus: tip.status,
      newStatus: 'PAID_OUT',
      amountCents: tip.amount,
      beneficiaryCleanerId: tip.beneficiaryCleanerId,
      paidOutMethod: method,
      payoutReference: input.payoutReference?.trim() || null,
    },
  });

  return {
    ok: true,
    tipId: tip.id,
    status: 'PAID_OUT',
    alreadyPaidOut: false,
  };
}
