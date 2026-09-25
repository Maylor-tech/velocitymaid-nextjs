/**
 * Future team-tip attribution (P0-D1).
 *
 * Uses JobTeamMember + assignedCleaner + accepted JobOffer evidence.
 * Creates TipAllocation rows ONLY when:
 *   - participant set is unambiguous (known cleaner ids), AND
 *   - an approved auto-split policy is enabled, AND
 *   - the tip amount divides evenly under that policy.
 *
 * Product has NOT approved automatic equal/% splits yet (TEAM_TIP_AUTO_SPLIT_POLICY = NONE).
 * When multiple earners are recorded and no policy applies: leave tip unresolved
 * (needsReconcile + TEAM_TIP_MANUAL_ALLOCATION) and do NOT notify cleaners.
 *
 * Never invents percentage splits. Never creates multiple Tip rows.
 */
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { isTipReceived, normalizeTipStatus } from '@/lib/tips/statuses';
import { setTipAllocations } from '@/lib/tips/tipAllocation';

/**
 * NONE — do not auto-create TipAllocation; mark manual allocation needed.
 * EQUAL_WHEN_DIVISIBLE — future: equal share when amountCents % n === 0.
 */
export const TEAM_TIP_AUTO_SPLIT_POLICY: 'NONE' | 'EQUAL_WHEN_DIVISIBLE' = 'NONE';

export const TEAM_TIP_MANUAL_ALLOCATION_REASON = 'TEAM_TIP_MANUAL_ALLOCATION';

export type TeamTipParticipantsResult =
  | { ok: true; cleanerIds: string[]; jobId: string }
  | {
      ok: false;
      code: 'NO_JOB' | 'NO_EARNERS' | 'AMBIGUOUS';
      cleanerIds: string[];
      jobId: string | null;
    };

/** Collect service-earner ids from established job evidence (same sources as beneficiary.ts). */
export async function resolveTeamTipParticipants(
  jobId: string
): Promise<TeamTipParticipantsResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, assignedCleanerId: true },
  });
  if (!job) {
    return { ok: false, code: 'NO_JOB', cleanerIds: [], jobId: null };
  }

  const [teamMembers, acceptedOffers] = await Promise.all([
    prisma.jobTeamMember.findMany({
      where: { jobId },
      select: { cleanerId: true },
    }),
    prisma.jobOffer.findMany({
      where: { jobId, status: 'ACCEPTED' },
      select: { cleanerId: true },
    }),
  ]);

  const earnerIds = new Set<string>();
  if (job.assignedCleanerId) earnerIds.add(job.assignedCleanerId);
  for (const m of teamMembers) earnerIds.add(m.cleanerId);
  for (const o of acceptedOffers) earnerIds.add(o.cleanerId);

  const cleanerIds = [...earnerIds];
  if (cleanerIds.length === 0) {
    return { ok: false, code: 'NO_EARNERS', cleanerIds: [], jobId: job.id };
  }

  // Unambiguous = deterministic set of known cleaner ids from evidence.
  // Multiple members is still "unambiguous participants" (we know who they are);
  // ambiguity of *split amounts* is handled by the auto-split policy gate below.
  return { ok: true, cleanerIds, jobId: job.id };
}

export type TeamTipAttributionResult =
  | { outcome: 'SKIPPED'; reason: string }
  | { outcome: 'SOLE'; cleanerId: string }
  | { outcome: 'ALLOCATED'; allocations: Array<{ cleanerId: string; amountCents: number }> }
  | { outcome: 'UNRESOLVED_MANUAL'; cleanerIds: string[]; reason: string };

/**
 * After tip receipt: if team earners exist and no sole beneficiary / allocations,
 * either auto-allocate (when policy allows) or leave manual unresolved (no notify).
 */
export async function maybeAttributeTeamTip(input: {
  tipId: string;
  /** When false, never send cleaner emails (historical / ops). Default true. */
  notify?: boolean;
  adminId?: string | null;
}): Promise<TeamTipAttributionResult> {
  const notify = input.notify !== false;

  const tip = await prisma.tip.findUnique({
    where: { id: input.tipId },
    select: {
      id: true,
      amount: true,
      status: true,
      jobId: true,
      beneficiaryCleanerId: true,
      needsReconcile: true,
      reconcileReason: true,
      refundedAt: true,
      TipAllocation: {
        select: { id: true, status: true },
      },
    },
  });

  if (!tip) return { outcome: 'SKIPPED', reason: 'NOT_FOUND' };
  if (!isTipReceived(tip.status)) return { outcome: 'SKIPPED', reason: 'NOT_RECEIVED' };
  if (normalizeTipStatus(tip.status) === 'REFUNDED' || tip.refundedAt) {
    return { outcome: 'SKIPPED', reason: 'REFUNDED' };
  }
  if (tip.TipAllocation.some((a) => a.status.toUpperCase() !== 'CANCELLED')) {
    return { outcome: 'SKIPPED', reason: 'ALREADY_ALLOCATED' };
  }
  // Sole beneficiary already frozen — guest sole path; no team attribution needed.
  if (tip.beneficiaryCleanerId) {
    return { outcome: 'SOLE', cleanerId: tip.beneficiaryCleanerId };
  }
  if (!tip.jobId) {
    return { outcome: 'SKIPPED', reason: 'NO_JOB' };
  }

  const participants = await resolveTeamTipParticipants(tip.jobId);
  if (participants.ok === false) {
    return { outcome: 'SKIPPED', reason: participants.code };
  }

  if (participants.cleanerIds.length === 1) {
    return { outcome: 'SOLE', cleanerId: participants.cleanerIds[0] };
  }

  // Multiple unambiguous participants — require approved split policy to allocate.
  if (TEAM_TIP_AUTO_SPLIT_POLICY === 'NONE') {
    if (
      tip.needsReconcile &&
      tip.reconcileReason === TEAM_TIP_MANUAL_ALLOCATION_REASON
    ) {
      return {
        outcome: 'UNRESOLVED_MANUAL',
        cleanerIds: participants.cleanerIds,
        reason: TEAM_TIP_MANUAL_ALLOCATION_REASON,
      };
    }

    await prisma.tip.update({
      where: { id: tip.id },
      data: {
        needsReconcile: true,
        reconcileReason: TEAM_TIP_MANUAL_ALLOCATION_REASON,
      },
    });

    await logAuditEntry({
      actorId: input.adminId ?? null,
      actorRole: input.adminId ? 'ADMIN' : 'SYSTEM',
      action: 'TIP_TEAM_ALLOCATION_UNRESOLVED',
      entityType: 'Tip',
      entityId: tip.id,
      description:
        'Team tip participants known but no approved auto-split policy — manual TipAllocation required',
      changes: {
        cleanerIds: participants.cleanerIds,
        amountCents: tip.amount,
        autoSplitPolicy: TEAM_TIP_AUTO_SPLIT_POLICY,
        notify: false,
      },
    });

    return {
      outcome: 'UNRESOLVED_MANUAL',
      cleanerIds: participants.cleanerIds,
      reason: TEAM_TIP_MANUAL_ALLOCATION_REASON,
    };
  }

  // EQUAL_WHEN_DIVISIBLE (future) — do not invent odd-cent remainders.
  const n = participants.cleanerIds.length;
  if (tip.amount % n !== 0) {
    await prisma.tip.update({
      where: { id: tip.id },
      data: {
        needsReconcile: true,
        reconcileReason: TEAM_TIP_MANUAL_ALLOCATION_REASON,
      },
    });
    return {
      outcome: 'UNRESOLVED_MANUAL',
      cleanerIds: participants.cleanerIds,
      reason: 'AMOUNT_NOT_EVENLY_DIVISIBLE',
    };
  }

  const share = tip.amount / n;
  const lines = participants.cleanerIds.map((cleanerId) => ({
    cleanerId,
    amountCents: share,
  }));

  const alloc = await setTipAllocations({
    tipId: tip.id,
    lines,
    adminId: input.adminId || 'system-team-attribution',
    notify,
    auditAction: 'TIP_TEAM_ALLOCATIONS_AUTO',
    auditDescription: `Auto equal team tip allocation (${n} cleaners × ${share}¢)`,
    auditExtra: { autoSplitPolicy: TEAM_TIP_AUTO_SPLIT_POLICY },
  });

  if (alloc.ok === false) {
    return { outcome: 'SKIPPED', reason: alloc.code };
  }

  return {
    outcome: 'ALLOCATED',
    allocations: alloc.allocations.map((a) => ({
      cleanerId: a.cleanerId,
      amountCents: a.amountCents,
    })),
  };
}

/** Fire-and-forget for webhook / confirm-received. */
export function maybeAttributeTeamTipSafe(input: {
  tipId: string;
  notify?: boolean;
  adminId?: string | null;
}): void {
  void maybeAttributeTeamTip(input).catch((err) => {
    console.error('[maybeAttributeTeamTipSafe]', input.tipId, err);
  });
}
