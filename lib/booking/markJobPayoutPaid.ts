import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';

export type MarkPayoutPaidInput = {
  payoutId: string;
  adminId: string;
  paidMethodType?: string | null;
  paidMethodLabel?: string | null;
  reference?: string | null;
  paidAt?: Date;
};

export type MarkPayoutPaidResult =
  | {
      ok: true;
      payout: {
        id: string;
        jobId: string;
        status: string;
        paidAt: Date | null;
        executionMethod: string | null;
        externalReferenceId: string | null;
        policyEvalDetails: unknown;
      };
    }
  | { ok: false; status: number; error: string };

const MARKABLE_STATUSES = new Set(['READY', 'APPROVED']);

/**
 * Manual admin settlement: READY/APPROVED → PAID.
 * Tracks payment method + reference for Zelle/CashApp/bank/cash/check payouts.
 */
export async function markJobPayoutPaid(
  input: MarkPayoutPaidInput
): Promise<MarkPayoutPaidResult> {
  const payout = await prisma.jobPayout.findUnique({
    where: { id: input.payoutId },
    select: {
      id: true,
      jobId: true,
      cleanerId: true,
      branchId: true,
      status: true,
      cleanerAmount: true,
      currency: true,
      paidAt: true,
      policyEvalDetails: true,
    },
  });

  if (!payout) {
    return { ok: false, status: 404, error: 'Payout not found' };
  }

  if (payout.status === 'PAID') {
    return { ok: false, status: 409, error: 'Payout is already marked as PAID' };
  }

  if (!MARKABLE_STATUSES.has(payout.status)) {
    return {
      ok: false,
      status: 400,
      error: `Cannot mark payout as PAID. Current status is ${payout.status}. Only READY or APPROVED payouts can be marked paid manually.`,
    };
  }

  const settlementTimestamp = input.paidAt ?? new Date();
  const methodType = input.paidMethodType?.trim() || 'MANUAL';
  const existingDetails = (payout.policyEvalDetails as Record<string, unknown>) || {};

  const updatedDetails = {
    ...existingDetails,
    paymentSettlement: {
      methodType,
      label: input.paidMethodLabel?.trim() || null,
      reference: input.reference?.trim() || null,
      timestamp: settlementTimestamp.toISOString(),
      adminId: input.adminId,
      manual: true,
    },
  };

  await prisma.$transaction(async (tx) => {
    await tx.jobPayout.update({
      where: { id: payout.id },
      data: {
        status: 'PAID',
        paidAt: settlementTimestamp,
        executedAt: settlementTimestamp,
        executionMethod: methodType,
        externalReferenceId: input.reference?.trim() || null,
        policyEvalDetails: updatedDetails,
      },
    });

    const existingLedger = await tx.transactionLedger.findFirst({
      where: {
        referenceId: payout.id,
        referenceType: 'JobPayout',
      },
    });

    if (!existingLedger) {
      const now = settlementTimestamp;
      await tx.transactionLedger.create({
        data: {
          id: randomUUID(),
          branchId: payout.branchId,
          transactionType: 'CLEANER_PAYOUT',
          amount: Number(payout.cleanerAmount),
          currency: payout.currency,
          description: `Payout marked PAID for job ${payout.jobId}`,
          referenceId: payout.id,
          referenceType: 'JobPayout',
          cleanerId: payout.cleanerId,
          updatedAt: now,
          metadata: {
            jobId: payout.jobId,
            payoutId: payout.id,
            paidAt: settlementTimestamp.toISOString(),
            methodType,
            reference: input.reference?.trim() || null,
          },
        },
      });
    }
  });

  const updated = await prisma.jobPayout.findUnique({
    where: { id: payout.id },
    select: {
      id: true,
      jobId: true,
      status: true,
      paidAt: true,
      executionMethod: true,
      externalReferenceId: true,
      policyEvalDetails: true,
    },
  });

  if (!updated) {
    return { ok: false, status: 500, error: 'Failed to load updated payout' };
  }

  await logAuditEntry({
    actorId: input.adminId,
    actorRole: 'ADMIN',
    action: 'PAYOUT_MARK_PAID',
    entityType: 'JobPayout',
    entityId: payout.id,
    description: `Payout marked PAID for job ${payout.jobId} via ${methodType}`,
    changes: {
      previousStatus: payout.status,
      newStatus: 'PAID',
      payoutId: payout.id,
      jobId: payout.jobId,
      cleanerId: payout.cleanerId,
      timestamp: settlementTimestamp.toISOString(),
      methodType,
      reference: input.reference?.trim() || null,
      note: input.paidMethodLabel?.trim() || null,
    },
  });

  return { ok: true, payout: updated };
}
