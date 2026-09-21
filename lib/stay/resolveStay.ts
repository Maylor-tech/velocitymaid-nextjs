/**
 * Phase 1B — resolve exactly one COMPLETED job for a guest stay date.
 * Fail closed on 0 or 2+ matches. Never returns job lists or Job.id to callers
 * that build guest payloads (internal jobId is for ensureGuest only).
 */

import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseServiceDateInput, serviceDateKey } from '@/lib/dates/serviceDate';
import {
  ensureGuestServiceFeedbackForJob,
  feedbackPublicUrl,
} from '@/lib/feedback/serviceFeedback';
import {
  findActivePropertyByGuestToken,
  guestFacingDisplayName,
} from '@/lib/stay/propertyGuestAccess';
import { mintGuestTipAuthorization } from '@/lib/tips/guestTipAuthorization';

export type StayResolveFailureCode =
  | 'INVALID_TOKEN'
  | 'INVALID_DATE'
  | 'NO_MATCH'
  | 'AMBIGUOUS'
  | 'RATE_LIMITED';

export type StayResolveResult =
  | {
      ok: true;
      feedbackToken: string;
      feedbackUrl: string;
      tipGrantToken: string;
      tipUrl: string;
      tipGrantStatus: 'MINTED' | 'REISSUED';
      propertyLabel: string;
      serviceDate: string;
    }
  | {
      ok: false;
      code: StayResolveFailureCode;
      message: string;
    };

function utcDayRange(day: Date): { gte: Date; lt: Date } {
  const gte = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())
  );
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

/**
 * Recent completed service/checkout dates for guest selection.
 * Returns opaque YYYY-MM-DD keys only — never Job IDs or addresses.
 */
export async function listRecentCompletedStayDates(
  propertyId: string,
  options?: { limit?: number; lookbackDays?: number }
): Promise<string[]> {
  const limit = Math.min(Math.max(options?.limit ?? 12, 1), 30);
  const lookbackDays = Math.min(Math.max(options?.lookbackDays ?? 120, 1), 366);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  since.setUTCHours(0, 0, 0, 0);

  const jobs = await prisma.job.findMany({
    where: {
      propertyId,
      status: JobStatus.COMPLETED,
      archivedAt: null,
      preferredDate: { gte: since, not: null },
    },
    select: { preferredDate: true },
    orderBy: { preferredDate: 'desc' },
    take: limit * 3,
  });

  const seen = new Set<string>();
  const dates: string[] = [];
  for (const j of jobs) {
    if (!j.preferredDate) continue;
    const key = serviceDateKey(j.preferredDate);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    dates.push(key);
    if (dates.length >= limit) break;
  }
  return dates;
}

/**
 * Match COMPLETED, non-archived jobs on property for exact preferredDate calendar day.
 */
export async function findCompletedJobsForStayDay(
  propertyId: string,
  checkoutDate: string
): Promise<{ dayKey: string; jobs: { id: string; preferredDate: Date }[] } | null> {
  const day = parseServiceDateInput(checkoutDate);
  if (!day) return null;

  const { gte, lt } = utcDayRange(day);
  const jobs = await prisma.job.findMany({
    where: {
      propertyId,
      status: JobStatus.COMPLETED,
      archivedAt: null,
      preferredDate: { gte, lt },
    },
    select: {
      id: true,
      preferredDate: true,
    },
    orderBy: { preferredDate: 'asc' },
    take: 5,
  });

  const dayKey = serviceDateKey(day)!;
  const exact = jobs.filter(
    (j) => j.preferredDate && serviceDateKey(j.preferredDate) === dayKey
  );

  return {
    dayKey,
    jobs: exact.map((j) => ({
      id: j.id,
      preferredDate: j.preferredDate!,
    })),
  };
}

export async function resolveStayToGuestFeedback(
  opaqueToken: string,
  checkoutDate: string
): Promise<StayResolveResult> {
  const property = await findActivePropertyByGuestToken(opaqueToken);
  if (!property) {
    return {
      ok: false,
      code: 'INVALID_TOKEN',
      message: 'This stay link is invalid or no longer active.',
    };
  }

  const matched = await findCompletedJobsForStayDay(property.id, checkoutDate);
  if (!matched) {
    return {
      ok: false,
      code: 'INVALID_DATE',
      message: 'Enter a valid checkout date (YYYY-MM-DD).',
    };
  }

  if (matched.jobs.length === 0) {
    const recent = await listRecentCompletedStayDates(property.id, {
      limit: 8,
    });
    const hint =
      recent.length > 0
        ? ` Available completed dates: ${recent.join(', ')}.`
        : ' If your clean has not been marked completed yet, please try again later or contact VelocityMaid.';
    return {
      ok: false,
      code: 'NO_MATCH',
      message: `We couldn’t match a completed clean for that date.${hint}`,
    };
  }

  if (matched.jobs.length > 1) {
    return {
      ok: false,
      code: 'AMBIGUOUS',
      message:
        'We need help matching this stay. Please contact VelocityMaid for assistance.',
    };
  }

  const job = matched.jobs[0]!;
  const ensured = await ensureGuestServiceFeedbackForJob(job.id);

  // Always mint a usable tip URL after a successful match. If an active grant
  // already exists, replace it (hash-at-rest cannot re-return the prior raw token).
  const tipGrant = await mintGuestTipAuthorization({
    jobId: job.id,
    propertyId: property.id,
    replaceActive: true,
  });
  const propertyLabel = guestFacingDisplayName(property.guestDisplayName);

  if (tipGrant.status !== 'MINTED' && tipGrant.status !== 'REISSUED') {
    // replaceActive should always yield MINTED/REISSUED; fail closed rather than tip-less UX
    return {
      ok: false,
      code: 'NO_MATCH',
      message:
        'We matched your stay but could not open tipping right now. Please try again or contact VelocityMaid.',
    };
  }

  return {
    ok: true,
    feedbackToken: ensured.feedbackToken,
    feedbackUrl: ensured.feedbackUrl || feedbackPublicUrl(ensured.feedbackToken),
    tipGrantToken: tipGrant.grantToken,
    tipUrl: tipGrant.tipUrl,
    tipGrantStatus: tipGrant.status,
    propertyLabel,
    serviceDate: matched.dayKey,
  };
}
