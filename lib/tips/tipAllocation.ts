/**
 * TipAllocation — child shares of a single Tip payment.
 *
 * Invariant: one Stripe PaymentIntent → one Tip → zero or more TipAllocations.
 * Never create multiple Tip rows for one payment.
 */

import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  isTipPaidOut,
  isTipReceived,
  isTipSettlementBlockedByDispute,
  normalizeTipStatus,
} from '@/lib/tips/statuses';

export const TIP_ALLOCATION_STATUSES = ['OWED', 'PAID_OUT', 'CANCELLED'] as const;
export type TipAllocationStatus = (typeof TIP_ALLOCATION_STATUSES)[number];

export type AllocationLineInput = {
  cleanerId: string;
  amountCents: number;
};

export type AllocationSummary = {
  allocatedCents: number;
  owedCents: number;
  paidOutCents: number;
  cancelledCents: number;
  fullyAllocated: boolean;
  allOwedSettled: boolean;
  hasAllocations: boolean;
};

/** Active financial lines count toward tip face value (not CANCELLED). */
export function isActiveAllocationStatus(status: string): boolean {
  const s = status.toUpperCase();
  return s === 'OWED' || s === 'PAID_OUT';
}

export function summarizeAllocations(
  tipAmountCents: number,
  rows: Array<{ amountCents: number; status: string }>
): AllocationSummary {
  let allocatedCents = 0;
  let owedCents = 0;
  let paidOutCents = 0;
  let cancelledCents = 0;
  for (const r of rows) {
    const s = r.status.toUpperCase();
    if (s === 'CANCELLED') {
      cancelledCents += r.amountCents;
      continue;
    }
    if (s === 'OWED' || s === 'PAID_OUT') {
      allocatedCents += r.amountCents;
      if (s === 'OWED') owedCents += r.amountCents;
      if (s === 'PAID_OUT') paidOutCents += r.amountCents;
    }
  }
  return {
    allocatedCents,
    owedCents,
    paidOutCents,
    cancelledCents,
    fullyAllocated: allocatedCents === tipAmountCents && tipAmountCents > 0,
    allOwedSettled:
      rows.some((r) => isActiveAllocationStatus(r.status)) && owedCents === 0,
    hasAllocations: rows.some((r) => isActiveAllocationStatus(r.status)),
  };
}

export function assertValidAllocationLines(
  tipAmountCents: number,
  lines: AllocationLineInput[]
): { ok: true } | { ok: false; code: string; error: string } {
  if (!lines.length) {
    return { ok: false, code: 'EMPTY', error: 'At least one allocation is required.' };
  }
  const seen = new Set<string>();
  let sum = 0;
  for (const line of lines) {
    if (!line.cleanerId?.trim()) {
      return { ok: false, code: 'NO_CLEANER', error: 'cleanerId is required.' };
    }
    if (seen.has(line.cleanerId)) {
      return {
        ok: false,
        code: 'DUPLICATE_CLEANER',
        error: 'Duplicate cleaner in allocation set.',
      };
    }
    seen.add(line.cleanerId);
    if (!Number.isInteger(line.amountCents) || line.amountCents <= 0) {
      return {
        ok: false,
        code: 'INVALID_AMOUNT',
        error: 'Allocation amounts must be positive integers (cents).',
      };
    }
    sum += line.amountCents;
  }
  if (sum > tipAmountCents) {
    return {
      ok: false,
      code: 'OVER_ALLOCATED',
      error: `Allocations (${sum}) exceed tip amount (${tipAmountCents}).`,
    };
  }
  if (sum !== tipAmountCents) {
    return {
      ok: false,
      code: 'UNDER_ALLOCATED',
      error: `Allocations (${sum}) must equal tip amount (${tipAmountCents}) for a full allocation.`,
    };
  }
  return { ok: true };
}

/**
 * Replace/create full allocation set for a tip (transactional).
 * Rejects if any existing allocation is already PAID_OUT.
 *
 * Notification history is durable across reconciliation:
 * - same (tipId, cleanerId) → update in place; never clear notifiedAt
 * - amount change on an already-notified cleaner → no automatic resend
 * - new cleaner → notifiedAt null (eligible for first notify)
 * - removed cleaner → CANCELLED (row kept so re-add cannot wipe history)
 * Never uses deleteMany (that would reset notifiedAt).
 */
export async function setTipAllocations(input: {
  tipId: string;
  lines: AllocationLineInput[];
  adminId: string;
  /** When false, skip cleaner tip emails (historical / ops). Default true. */
  notify?: boolean;
  auditAction?: string;
  auditDescription?: string;
  auditExtra?: Record<string, unknown>;
}): Promise<
  | { ok: true; allocations: Array<{ id: string; cleanerId: string; amountCents: number }> }
  | { ok: false; status: number; code: string; error: string }
> {
  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    select: {
      id: true,
      amount: true,
      status: true,
      refundedAt: true,
      TipAllocation: {
        select: {
          id: true,
          status: true,
          cleanerId: true,
          amountCents: true,
          notifiedAt: true,
        },
      },
    },
  });
  if (!tip) {
    return { ok: false, status: 404, code: 'NOT_FOUND', error: 'Tip not found' };
  }
  if (normalizeTipStatus(tip.status) === 'REFUNDED' || tip.refundedAt) {
    return {
      ok: false,
      status: 409,
      code: 'REFUNDED',
      error: 'Cannot allocate a refunded tip.',
    };
  }
  if (tip.TipAllocation.some((a) => a.status.toUpperCase() === 'PAID_OUT')) {
    return {
      ok: false,
      status: 409,
      code: 'ALREADY_PARTIAL_PAID',
      error: 'Cannot replace allocations after a share has been marked PAID_OUT.',
    };
  }

  const valid = assertValidAllocationLines(tip.amount, input.lines);
  if (valid.ok === false) {
    return { ok: false, status: 400, code: valid.code, error: valid.error };
  }

  const nextCleanerIds = new Set(input.lines.map((l) => l.cleanerId));
  const existingByCleaner = new Map(
    tip.TipAllocation.map((a) => [a.cleanerId, a])
  );

  const created = await prisma.$transaction(async (tx) => {
    const rows: Array<{ id: string; cleanerId: string; amountCents: number }> =
      [];

    for (const line of input.lines) {
      const existing = existingByCleaner.get(line.cleanerId);
      if (existing) {
        // Preserve notifiedAt — amount changes must not reset delivery history.
        const row = await tx.tipAllocation.update({
          where: { id: existing.id },
          data: {
            amountCents: line.amountCents,
            status: 'OWED',
          },
          select: { id: true, cleanerId: true, amountCents: true },
        });
        rows.push(row);
      } else {
        const row = await tx.tipAllocation.create({
          data: {
            tipId: tip.id,
            cleanerId: line.cleanerId,
            amountCents: line.amountCents,
            status: 'OWED',
          },
          select: { id: true, cleanerId: true, amountCents: true },
        });
        rows.push(row);
      }
    }

    // Soft-remove: keep row + notifiedAt so a later re-add cannot re-notify.
    for (const existing of tip.TipAllocation) {
      if (nextCleanerIds.has(existing.cleanerId)) continue;
      if (existing.status.toUpperCase() === 'CANCELLED') continue;
      await tx.tipAllocation.update({
        where: { id: existing.id },
        data: { status: 'CANCELLED' },
      });
    }

    // Full allocation resolves manual team-attribution hold.
    await tx.tip.update({
      where: { id: tip.id },
      data: {
        needsReconcile: false,
        reconcileReason: null,
      },
    });
    return rows;
  });

  await logAuditEntry({
    actorId: input.adminId,
    actorRole: 'ADMIN',
    action: input.auditAction || 'TIP_ALLOCATIONS_SET',
    entityType: 'Tip',
    entityId: tip.id,
    description:
      input.auditDescription ||
      `Tip allocations set (${created.map((c) => `${c.cleanerId}:${c.amountCents}`).join(', ')})`,
    changes: {
      tipAmountCents: tip.amount,
      allocations: created,
      platformTipShareCents: 0,
      notificationHistoryPreserved: true,
      ...(input.auditExtra || {}),
    },
  });

  if (input.notify !== false && isTipReceived(tip.status)) {
    const { notifyCleanersOfTipReceived } = await import(
      '@/lib/notifications/cleanerTipReceived'
    );
    await notifyCleanersOfTipReceived(tip.id).catch((err) => {
      console.error('[setTipAllocations] notify failed', tip.id, err);
    });
  }

  return { ok: true, allocations: created };
}

export async function markTipAllocationPaidOut(input: {
  allocationId: string;
  adminId: string;
  payoutMethod: string;
  payoutReference?: string | null;
  paidOutAt?: Date;
}): Promise<
  | {
      ok: true;
      allocationId: string;
      tipId: string;
      status: 'PAID_OUT';
      alreadyPaidOut: boolean;
      parentStatus: string;
      fundsTransferredByApi: false;
    }
  | { ok: false; status: number; code: string; error: string }
> {
  const allocation = await prisma.tipAllocation.findUnique({
    where: { id: input.allocationId },
    include: {
      Tip: {
        select: {
          id: true,
          status: true,
          amount: true,
          receivedAt: true,
          refundedAt: true,
          disputeStatus: true,
          needsReconcile: true,
          paymentMethod: true,
          stripePaymentIntentId: true,
          TipAllocation: {
            select: { id: true, status: true, amountCents: true },
          },
        },
      },
    },
  });

  if (!allocation) {
    return { ok: false, status: 404, code: 'NOT_FOUND', error: 'Allocation not found' };
  }

  if (allocation.status.toUpperCase() === 'PAID_OUT') {
    return {
      ok: true,
      allocationId: allocation.id,
      tipId: allocation.tipId,
      status: 'PAID_OUT',
      alreadyPaidOut: true,
      parentStatus: allocation.Tip.status,
      fundsTransferredByApi: false,
    };
  }

  if (allocation.status.toUpperCase() === 'CANCELLED') {
    return {
      ok: false,
      status: 409,
      code: 'CANCELLED',
      error: 'Cannot settle a cancelled allocation.',
    };
  }

  const tip = allocation.Tip;
  if (!isTipReceived(tip.status) && !isTipPaidOut(tip.status)) {
    return {
      ok: false,
      status: 409,
      code: 'NOT_RECEIVED',
      error: 'Parent tip payment is not confirmed RECEIVED.',
    };
  }
  if (tip.refundedAt || normalizeTipStatus(tip.status) === 'REFUNDED') {
    return {
      ok: false,
      status: 409,
      code: 'REFUNDED',
      error: 'Cannot settle allocations on a refunded tip.',
    };
  }
  if (isTipSettlementBlockedByDispute(tip.disputeStatus)) {
    return {
      ok: false,
      status: 409,
      code: 'DISPUTE_BLOCK',
      error: 'Cannot settle while dispute blocks the tip.',
    };
  }
  if (tip.needsReconcile) {
    return {
      ok: false,
      status: 409,
      code: 'NEEDS_RECONCILE',
      error: 'Tip is flagged for reconciliation — resolve before settling shares.',
    };
  }
  if (!tip.receivedAt && !isTipPaidOut(tip.status)) {
    return {
      ok: false,
      status: 409,
      code: 'NOT_RECEIVED',
      error: 'Parent tip has no receivedAt.',
    };
  }
  if (tip.paymentMethod === 'STRIPE' && !tip.stripePaymentIntentId) {
    return {
      ok: false,
      status: 409,
      code: 'UNCONFIRMED_PAYMENT',
      error: 'Stripe tip has no PaymentIntent reference.',
    };
  }

  const method = input.payoutMethod.trim().toUpperCase();
  if (!method) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_METHOD',
      error: 'payoutMethod is required (records external payment only).',
    };
  }

  const paidOutAt = input.paidOutAt ?? new Date();

  const result = await prisma.$transaction(async (tx) => {
    await tx.tipAllocation.update({
      where: { id: allocation.id },
      data: {
        status: 'PAID_OUT',
        paidOutAt,
        payoutMethod: method,
        payoutReference: input.payoutReference?.trim() || null,
        paidOutByAdminId: input.adminId,
      },
    });

    const remaining = await tx.tipAllocation.findMany({
      where: { tipId: tip.id },
      select: { status: true, amountCents: true },
    });
    const summary = summarizeAllocations(tip.amount, remaining);
    let parentStatus = tip.status;
    if (summary.hasAllocations && summary.allOwedSettled && summary.fullyAllocated) {
      await tx.tip.update({
        where: { id: tip.id },
        data: {
          status: 'PAID_OUT',
          paidOutAt,
          paidOutByAdminId: input.adminId,
          paidOutMethod: 'ALLOCATIONS',
          payoutReference: `allocations-complete:${tip.id}`,
        },
      });
      parentStatus = 'PAID_OUT';
    }
    return { parentStatus, summary };
  });

  await logAuditEntry({
    actorId: input.adminId,
    actorRole: 'ADMIN',
    action: 'TIP_ALLOCATION_PAID_OUT',
    entityType: 'TipAllocation',
    entityId: allocation.id,
    description: `Tip allocation marked PAID_OUT via ${method} — API did not transfer funds`,
    changes: {
      tipId: tip.id,
      cleanerId: allocation.cleanerId,
      amountCents: allocation.amountCents,
      payoutMethod: method,
      payoutReference: input.payoutReference?.trim() || null,
      parentStatus: result.parentStatus,
      fundsTransferredByApi: false,
    },
  });

  if (result.parentStatus === 'PAID_OUT' && tip.status !== 'PAID_OUT') {
    await logAuditEntry({
      actorId: input.adminId,
      actorRole: 'ADMIN',
      action: 'TIP_PAID_OUT',
      entityType: 'Tip',
      entityId: tip.id,
      description:
        'Parent tip marked PAID_OUT after all TipAllocations settled — API did not transfer funds',
      changes: {
        via: 'allocations',
        fundsTransferredByApi: false,
      },
    });
  }

  return {
    ok: true,
    allocationId: allocation.id,
    tipId: tip.id,
    status: 'PAID_OUT',
    alreadyPaidOut: false,
    parentStatus: result.parentStatus,
    fundsTransferredByApi: false,
  };
}

/** Cancel remaining OWED allocations (refund/dispute before payout). */
export async function cancelOwedTipAllocations(input: {
  tipId: string;
  reason: string;
}): Promise<number> {
  const result = await prisma.tipAllocation.updateMany({
    where: { tipId: input.tipId, status: 'OWED' },
    data: { status: 'CANCELLED' },
  });
  if (result.count > 0) {
    await logAuditEntry({
      actorRole: 'SYSTEM',
      action: 'TIP_ALLOCATIONS_CANCELLED',
      entityType: 'Tip',
      entityId: input.tipId,
      description: `Cancelled ${result.count} OWED tip allocation(s): ${input.reason}`,
      changes: { reason: input.reason, count: result.count },
    });
  }
  return result.count;
}
