import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  evaluateRebookingReminder,
  REBOOKING_REMINDER_ACTION,
  rebookingCandidateWhere,
  upcomingTurnoverWhere,
} from '@/lib/cron/rebookingReminders';
import { buildRebookingReminderProviderRequest } from '@/lib/email/cronAutomationEmails';
import { rebookingReminderIdempotencyKey, backfillSentRebookingReminders, parkExpiredRebookingClaims } from '@/lib/cron/rebookingReminderClaim';
import { authorizeRebookingExecution, rebookingDenialReason } from '@/lib/cron/rebookingExecutionControl';
import { fingerprintRebookingProviderRequest } from '@/lib/cron/rebookingPayloadFingerprint';
import { deliverAuthorizedRebookingReminder } from '@/lib/cron/rebookingV2Delivery';

export const REBOOKING_V2_BATCH_LIMIT = 5;

export type RebookingCandidate = {
  id: string;
  preferredDate: Date | null;
};

export function orderRebookingCandidates<T extends RebookingCandidate>(jobs: T[]): T[] {
  return [...jobs].sort((left, right) => {
    const leftTime = left.preferredDate ? left.preferredDate.getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.preferredDate ? right.preferredDate.getTime() : Number.POSITIVE_INFINITY;
    if (leftTime !== rightTime) return leftTime - rightTime;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
  }).slice(0, REBOOKING_V2_BATCH_LIMIT);
}

function dayWindow(daysFromToday: number): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysFromToday);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function runAuthorizedRebookingBatch(generation: number) {
  const opening = await authorizeRebookingExecution({ expectedGeneration: generation });
  const openingReason = rebookingDenialReason(opening);
  if (openingReason) {
    return {
      success: false,
      authorized: false,
      reason: openingReason,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      unknown: 0,
      held: 0,
    };
  }
  await parkExpiredRebookingClaims();
  await backfillSentRebookingReminders();
  const { start, end } = dayWindow(7);
  const queried = await prisma.job.findMany({
    where: rebookingCandidateWhere(start, end),
    select: {
      id: true,
      customerId: true,
      preferredDate: true,
      address: true,
      status: true,
      Customer: {
        select: { email: true, firstName: true, defaultAddress: true, addressLine1: true },
      },
    },
    orderBy: [{ preferredDate: 'asc' }, { id: 'asc' }],
    take: REBOOKING_V2_BATCH_LIMIT,
  });
  const jobs = orderRebookingCandidates(queried);

  const deliveries = jobs.length === 0
    ? []
    : await prisma.rebookingReminderDelivery.findMany({
      where: { jobId: { in: jobs.map((job) => job.id) } },
      select: { jobId: true, status: true },
    });
  const settled = new Set(
    deliveries.filter((row) => row.status === 'ACCEPTED' || row.status === 'UNKNOWN').map((row) => row.jobId)
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let unknown = 0;
  let held = 0;
  let claims = 0;

  for (const job of jobs) {
    if (claims >= REBOOKING_V2_BATCH_LIMIT) break;
    const stillAuthorized = await authorizeRebookingExecution({ expectedGeneration: generation });
    const stillDenied = rebookingDenialReason(stillAuthorized);
    if (stillDenied) {
      return {
        success: false,
        authorized: false,
        reason: stillDenied,
        processed: jobs.length,
        sent,
        failed,
        skipped,
        unknown,
        held,
      };
    }

    const precheck = evaluateRebookingReminder({
      job,
      alreadyReminded: settled.has(job.id),
      upcomingTurnoverScheduled: false,
    });
    if (!precheck.send) {
      skipped += 1;
      continue;
    }

    const checkout = new Date(job.preferredDate!);
    const followUpStart = new Date(checkout);
    followUpStart.setDate(followUpStart.getDate() + 1);
    followUpStart.setHours(0, 0, 0, 0);
    const followUpEnd = new Date(checkout);
    followUpEnd.setDate(followUpEnd.getDate() + 15);
    followUpEnd.setHours(0, 0, 0, 0);
    const turnoverFollowUp = await prisma.job.count({
      where: upcomingTurnoverWhere(job.customerId!, job.id, followUpStart, followUpEnd),
    });
    if (turnoverFollowUp > 0 || !job.Customer?.email) {
      skipped += 1;
      continue;
    }

    const request = buildRebookingReminderProviderRequest({
      toEmail: job.Customer.email,
      hostFirstName: job.Customer.firstName || 'there',
      propertyAddress: job.address || job.Customer.defaultAddress || job.Customer.addressLine1 || 'your property',
      checkoutDate: checkout,
      idempotencyKey: rebookingReminderIdempotencyKey(job.id),
    });
    const fingerprint = fingerprintRebookingProviderRequest(request);
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: job.id,
      request,
      fingerprint,
      authorize: () => authorizeRebookingExecution({ expectedGeneration: generation }),
    });
    if (typeof outcome === 'object' && outcome.outcome === 'authorization_revoked') {
      return {
        success: false,
        authorized: false,
        reason: outcome.reason,
        processed: jobs.length,
        sent,
        failed,
        skipped,
        unknown,
        held: held + 1,
      };
    }
    claims += 1;

    if (outcome === 'sent') {
      await logAuditEntry({
        action: REBOOKING_REMINDER_ACTION,
        entityType: 'Job',
        entityId: job.id,
        description: 'Rebooking reminder email sent to host',
        changes: { sentAt: new Date().toISOString() },
      });
      sent += 1;
    } else if (outcome === 'failed') failed += 1;
    else if (outcome === 'unknown' || outcome === 'accepted_unrecorded') unknown += 1;
    else if (outcome === 'payload_mismatch' || outcome === 'fingerprint_missing') held += 1;
    else skipped += 1;
  }

  return {
    success: true,
    authorized: true,
    processed: jobs.length,
    sent,
    failed,
    skipped,
    unknown,
    held,
  };
}
