/**
 * Historical $50 team-tip reconciliation (P0-D0).
 * Call only after TipAllocation migration is applied.
 * Does not create Stripe charges. Does not mark allocations PAID_OUT.
 */

import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { markTipReceived } from '@/lib/tips/markTipReceived';
import { setTipAllocations } from '@/lib/tips/tipAllocation';

export const HISTORICAL_50_TIP_ID = 'cmskddblp0000k304e5k5y9b8';
export const HISTORICAL_50_PI_ID = 'pi_3U29fgRqPKxN0h8W1sIum8oS';
export const BRIAN_CLEANER_ID = 'admin-1782271497170-94e9jc';
export const CARYLL_CLEANER_ID = '1a0483bc-8a0d-4837-9f00-5ec6b5d804d1';

export async function reconcileHistorical50TeamTip(input: {
  adminId: string;
}): Promise<
  | {
      ok: true;
      tipId: string;
      status: string;
      allocations: Array<{ id: string; cleanerId: string; amountCents: number }>;
      alreadyReconciled: boolean;
    }
  | { ok: false; status: number; code: string; error: string }
> {
  const tip = await prisma.tip.findUnique({
    where: { id: HISTORICAL_50_TIP_ID },
    include: {
      TipAllocation: {
        select: { id: true, cleanerId: true, amountCents: true, status: true },
      },
    },
  });
  if (!tip) {
    return { ok: false, status: 404, code: 'NOT_FOUND', error: 'Historical tip not found' };
  }
  if (tip.stripePaymentIntentId !== HISTORICAL_50_PI_ID) {
    return {
      ok: false,
      status: 409,
      code: 'PI_MISMATCH',
      error: 'Tip PaymentIntent does not match expected historical PI.',
    };
  }
  if (tip.amount !== 5000) {
    return {
      ok: false,
      status: 409,
      code: 'AMOUNT_MISMATCH',
      error: 'Tip amount is not $50.00.',
    };
  }

  const existingBrian = tip.TipAllocation.find(
    (a) => a.cleanerId === BRIAN_CLEANER_ID && a.amountCents === 2500
  );
  const existingCaryll = tip.TipAllocation.find(
    (a) => a.cleanerId === CARYLL_CLEANER_ID && a.amountCents === 2500
  );
  if (
    existingBrian &&
    existingCaryll &&
    tip.status.toUpperCase().includes('RECEIVED')
  ) {
    return {
      ok: true,
      tipId: tip.id,
      status: tip.status,
      allocations: tip.TipAllocation.map((a) => ({
        id: a.id,
        cleanerId: a.cleanerId,
        amountCents: a.amountCents,
      })),
      alreadyReconciled: true,
    };
  }

  await logAuditEntry({
    actorId: input.adminId,
    actorRole: 'ADMIN',
    action: 'TIP_HISTORICAL_TEAM_ATTESTATION',
    entityType: 'Tip',
    entityId: tip.id,
    description:
      'Operator attestation: Brian + Caryll jointly serviced; $50 tip never distributed; funds held by VelocityMaid',
    changes: {
      operators: ['Brian Bruce Maylor', 'Caryll Dagupen'],
      cleanerIds: [BRIAN_CLEANER_ID, CARYLL_CLEANER_ID],
      noPriorPayout: true,
      stripeFeeIsPlatformExpense: true,
      platformTipShareCents: 0,
      allocationDecision: { brianCents: 2500, caryllCents: 2500 },
      stripePaymentIntentId: HISTORICAL_50_PI_ID,
    },
  });

  // Ensure payment method / PI refs are durable on the receipt row
  await prisma.tip.update({
    where: { id: tip.id },
    data: {
      paymentMethod: tip.paymentMethod || 'STRIPE',
      providerReference: tip.providerReference || HISTORICAL_50_PI_ID,
      // Keep sole beneficiary null — allocations carry earner shares
      beneficiaryCleanerId: null,
    },
  });

  const received = await markTipReceived({
    tipId: tip.id,
    amountCents: 5000,
    providerReference: HISTORICAL_50_PI_ID,
    confirmedByAdminId: input.adminId,
    source: 'ADMIN_MANUAL',
    receivedAt: tip.receivedAt || new Date('2026-08-08T12:49:06.000Z'),
  });
  if (received.ok === false) {
    return {
      ok: false,
      status: received.status,
      code: received.code,
      error: received.error,
    };
  }

  await logAuditEntry({
    actorId: input.adminId,
    actorRole: 'ADMIN',
    action: 'TIP_HISTORICAL_RECEIPT_RECONCILED',
    entityType: 'Tip',
    entityId: tip.id,
    description:
      'Historical Stripe success reconciled into tip ledger as RECEIVED_UNATTRIBUTED (no new charge)',
    changes: {
      previousStatus: tip.status,
      newStatus: received.status,
      stripePaymentIntentId: HISTORICAL_50_PI_ID,
      amountCents: 5000,
      platformTipShareCents: 0,
      fundsTransferredByApi: false,
    },
  });

  const alloc = await setTipAllocations({
    tipId: tip.id,
    adminId: input.adminId,
    notify: false,
    lines: [
      { cleanerId: BRIAN_CLEANER_ID, amountCents: 2500 },
      { cleanerId: CARYLL_CLEANER_ID, amountCents: 2500 },
    ],
    auditAction: 'TIP_HISTORICAL_ALLOCATIONS_CREATED',
    auditDescription:
      'Historical team tip allocated $25 Brian + $25 Caryll (OWED) — not paid out',
    auditExtra: {
      noPriorPayout: true,
      fundsTransferredByApi: false,
      stripeFeeIsPlatformExpense: true,
      platformTipShareCents: 0,
      cleanerNotified: false,
    },
  });

  if (alloc.ok === false) {
    return {
      ok: false,
      status: alloc.status,
      code: alloc.code,
      error: alloc.error,
    };
  }

  const refreshed = await prisma.tip.findUnique({
    where: { id: tip.id },
    select: { status: true },
  });

  return {
    ok: true,
    tipId: tip.id,
    status: refreshed?.status || received.status,
    allocations: alloc.allocations,
    alreadyReconciled: false,
  };
}
