/**
 * Cleaner tip-received notification orchestrator.
 *
 * Triggers only when financially payable:
 * - sole-beneficiary Tip RECEIVED + isTipPayable
 * - OWED TipAllocation rows on a received tip (tipHasPayableAllocations)
 *
 * Idempotent via Tip.beneficiaryNotifiedAt / TipAllocation.notifiedAt claim-before-send.
 * Never includes guestMessage, ServiceFeedback, Stay token, or other cleaners' shares.
 * Never throws — callers fire-and-forget.
 */
import { prisma } from '@/lib/prisma';
import { logIntegrationEvent } from '@/lib/google/integrationLog';
import { sendCleanerTipReceivedEmail } from '@/lib/email/sendCleanerTipReceivedEmail';
import {
  isTipPayable,
  tipHasPayableAllocations,
} from '@/lib/tips/statuses';

export type TipNotifyOutcome = {
  soleNotified: boolean;
  soleAlreadyNotified: boolean;
  allocationNotified: number;
  allocationSkipped: number;
  skippedReason?: string;
};

function propertyDisplayName(input: {
  guestDisplayName?: string | null;
  name?: string | null;
  propertyAddress?: string | null;
}): string {
  const nick = input.guestDisplayName?.trim();
  if (nick) return nick;
  const name = input.name?.trim();
  if (name) return name;
  const addr = input.propertyAddress?.trim();
  if (addr) return addr;
  return 'a recent cleaning';
}

async function loadTipNotifyContext(tipId: string) {
  return prisma.tip.findUnique({
    where: { id: tipId },
    select: {
      id: true,
      amount: true,
      status: true,
      beneficiaryCleanerId: true,
      beneficiaryNotifiedAt: true,
      refundedAt: true,
      disputeStatus: true,
      needsReconcile: true,
      propertyAddress: true,
      jobId: true,
      Job: { select: { id: true, jobReference: true } },
      Property: { select: { guestDisplayName: true, name: true } },
      Beneficiary: { select: { id: true, name: true, email: true } },
      TipAllocation: {
        where: { status: 'OWED' },
        select: {
          id: true,
          cleanerId: true,
          amountCents: true,
          notifiedAt: true,
          Cleaner: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

async function claimSoleNotification(tipId: string): Promise<boolean> {
  const result = await prisma.tip.updateMany({
    where: { id: tipId, beneficiaryNotifiedAt: null },
    data: { beneficiaryNotifiedAt: new Date() },
  });
  return result.count === 1;
}

async function clearSoleNotificationClaim(tipId: string): Promise<void> {
  await prisma.tip.updateMany({
    where: { id: tipId },
    data: { beneficiaryNotifiedAt: null },
  });
}

async function claimAllocationNotification(allocationId: string): Promise<boolean> {
  const result = await prisma.tipAllocation.updateMany({
    where: { id: allocationId, notifiedAt: null },
    data: { notifiedAt: new Date() },
  });
  return result.count === 1;
}

async function clearAllocationNotificationClaim(allocationId: string): Promise<void> {
  await prisma.tipAllocation.updateMany({
    where: { id: allocationId },
    data: { notifiedAt: null },
  });
}

/**
 * Notify cleaners for a tip that just became payable (or allocations just set).
 * Safe to call on webhook replay — durable claims prevent duplicate sends.
 */
export async function notifyCleanersOfTipReceived(
  tipId: string
): Promise<TipNotifyOutcome> {
  const outcome: TipNotifyOutcome = {
    soleNotified: false,
    soleAlreadyNotified: false,
    allocationNotified: 0,
    allocationSkipped: 0,
  };

  try {
    const tip = await loadTipNotifyContext(tipId);
    if (!tip) {
      outcome.skippedReason = 'NOT_FOUND';
      return outcome;
    }

    const display = propertyDisplayName({
      guestDisplayName: tip.Property?.guestDisplayName,
      name: tip.Property?.name,
      propertyAddress: tip.propertyAddress,
    });
    const jobReference = tip.Job?.jobReference || tip.jobId || null;

    const owedCents = tip.TipAllocation.reduce((s, a) => s + a.amountCents, 0);
    const hasPayableAllocations = tipHasPayableAllocations({
      status: tip.status,
      refundedAt: tip.refundedAt,
      disputeStatus: tip.disputeStatus,
      needsReconcile: tip.needsReconcile,
      owedAllocationCents: owedCents,
    });

    // Team / allocation path: each cleaner sees only their own share.
    if (hasPayableAllocations && tip.TipAllocation.length > 0) {
      for (const alloc of tip.TipAllocation) {
        if (alloc.notifiedAt) {
          outcome.allocationSkipped += 1;
          continue;
        }
        const email = alloc.Cleaner?.email;
        if (!email) {
          outcome.allocationSkipped += 1;
          continue;
        }
        const claimed = await claimAllocationNotification(alloc.id);
        if (!claimed) {
          outcome.allocationSkipped += 1;
          continue;
        }
        const result = await sendCleanerTipReceivedEmail({
          cleanerEmail: email,
          cleanerName: alloc.Cleaner?.name || 'there',
          amountCents: alloc.amountCents,
          propertyDisplayName: display,
          jobReference,
        });
        await logIntegrationEvent({
          jobId: tip.jobId,
          channel: 'EMAIL',
          action: 'SEND_CLEANER_TIP_RECEIVED_EMAIL',
          provider: 'RESEND',
          status: result.sent ? 'SUCCESS' : 'FAILED',
          recipient: email,
          templateKey: 'cleaner_tip_received_allocation',
          triggeredBy: 'system',
          errorSummary: result.error
            ? `${result.error} (tip=${tip.id} alloc=${alloc.id} cents=${alloc.amountCents})`
            : `tip=${tip.id} alloc=${alloc.id} cents=${alloc.amountCents}`,
        }).catch(() => {});
        if (!result.sent) {
          await clearAllocationNotificationClaim(alloc.id);
          outcome.allocationSkipped += 1;
          continue;
        }
        outcome.allocationNotified += 1;
      }
      return outcome;
    }

    // Sole-beneficiary path
    const payable = isTipPayable({
      status: tip.status,
      beneficiaryCleanerId: tip.beneficiaryCleanerId,
      disputeStatus: tip.disputeStatus,
      refundedAt: tip.refundedAt,
      needsReconcile: tip.needsReconcile,
    });
    if (!payable) {
      outcome.skippedReason = 'NOT_PAYABLE';
      return outcome;
    }
    if (tip.beneficiaryNotifiedAt) {
      outcome.soleAlreadyNotified = true;
      return outcome;
    }
    const email = tip.Beneficiary?.email;
    if (!email || !tip.beneficiaryCleanerId) {
      outcome.skippedReason = 'NO_CLEANER_EMAIL';
      return outcome;
    }

    const claimed = await claimSoleNotification(tip.id);
    if (!claimed) {
      outcome.soleAlreadyNotified = true;
      return outcome;
    }

    const result = await sendCleanerTipReceivedEmail({
      cleanerEmail: email,
      cleanerName: tip.Beneficiary?.name || 'there',
      amountCents: tip.amount,
      propertyDisplayName: display,
      jobReference,
    });
    await logIntegrationEvent({
      jobId: tip.jobId,
      channel: 'EMAIL',
      action: 'SEND_CLEANER_TIP_RECEIVED_EMAIL',
      provider: 'RESEND',
      status: result.sent ? 'SUCCESS' : 'FAILED',
      recipient: email,
      templateKey: 'cleaner_tip_received_sole',
      triggeredBy: 'system',
      errorSummary: result.error
        ? `${result.error} (tip=${tip.id} cents=${tip.amount})`
        : `tip=${tip.id} cents=${tip.amount}`,
    }).catch(() => {});

    if (!result.sent) {
      await clearSoleNotificationClaim(tip.id);
      outcome.skippedReason = result.error || 'SEND_FAILED';
      return outcome;
    }

    outcome.soleNotified = true;
    return outcome;
  } catch (err) {
    console.error('[notifyCleanersOfTipReceived]', tipId, err);
    outcome.skippedReason = 'ERROR';
    return outcome;
  }
}

/** Fire-and-forget wrapper for webhook / admin routes. */
export function notifyCleanersOfTipReceivedSafe(tipId: string): void {
  void notifyCleanersOfTipReceived(tipId).catch((err) => {
    console.error('[notifyCleanersOfTipReceivedSafe]', tipId, err);
  });
}
