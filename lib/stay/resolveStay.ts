/**
 * Phase 1B / Stay Card — resolve exactly one COMPLETED job for a guest stay.
 * Primary: checkout date. Secondary: SINGLE_RECENT_ELIGIBLE (14-day window).
 * Fail closed on 0 or 2+ matches. Never returns job lists or Job.id to callers
 * that build guest payloads (internal jobId is for ensureGuest only).
 * Failed date guesses must not disclose which dates are real bookings.
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

/** Lookback for Stay Card “not sure of checkout date?” fallback. */
export const STAY_FALLBACK_LOOKBACK_DAYS = 14;

export const STAY_RESOLVE_MODE_SINGLE_RECENT = 'SINGLE_RECENT_ELIGIBLE' as const;
export type StayResolveMode = typeof STAY_RESOLVE_MODE_SINGLE_RECENT;

export type StayResolveRequest = {
  checkoutDate?: string;
  mode?: StayResolveMode;
};

export type StayResolveFailureCode =
  | 'INVALID_TOKEN'
  | 'INVALID_DATE'
  | 'NO_MATCH'
  | 'AMBIGUOUS'
  | 'FALLBACK_NOT_AVAILABLE'
  | 'INVALID_REQUEST'
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

function lookbackSince(lookbackDays: number): Date {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  since.setUTCHours(0, 0, 0, 0);
  return since;
}

/**
 * Recent completed service/checkout dates (internal / host tools).
 * Not returned on the public Stay GET — use isStayFallbackEligible instead.
 */
export async function listRecentCompletedStayDates(
  propertyId: string,
  options?: { limit?: number; lookbackDays?: number }
): Promise<string[]> {
  const limit = Math.min(Math.max(options?.limit ?? 12, 1), 30);
  const lookbackDays = Math.min(Math.max(options?.lookbackDays ?? 120, 1), 366);
  const since = lookbackSince(lookbackDays);

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

export type SingleRecentEligible =
  | { status: 'READY'; dayKey: string; jobId: string }
  | { status: 'AMBIGUOUS_DAY'; dayKey: string }
  | { status: 'NOT_AVAILABLE' };

/**
 * Exactly one eligible completed service day in the lookback window,
 * and exactly one COMPLETED job on that day — otherwise fail closed.
 */
export async function findSingleRecentEligibleStay(
  propertyId: string,
  lookbackDays: number = STAY_FALLBACK_LOOKBACK_DAYS
): Promise<SingleRecentEligible> {
  const since = lookbackSince(lookbackDays);
  const jobs = await prisma.job.findMany({
    where: {
      propertyId,
      status: JobStatus.COMPLETED,
      archivedAt: null,
      preferredDate: { gte: since, not: null },
    },
    select: { id: true, preferredDate: true },
    orderBy: { preferredDate: 'desc' },
    take: 40,
  });

  const byDay = new Map<string, string[]>();
  for (const j of jobs) {
    if (!j.preferredDate) continue;
    const key = serviceDateKey(j.preferredDate);
    if (!key) continue;
    const list = byDay.get(key) ?? [];
    list.push(j.id);
    byDay.set(key, list);
  }

  if (byDay.size !== 1) {
    return { status: 'NOT_AVAILABLE' };
  }

  const [[dayKey, jobIds]] = [...byDay.entries()];
  if (jobIds.length !== 1) {
    return { status: 'AMBIGUOUS_DAY', dayKey };
  }

  return { status: 'READY', dayKey, jobId: jobIds[0]! };
}

/** Boolean-only signal for public GET — never leaks dates or counts. */
export async function isStayFallbackEligible(
  propertyId: string,
  lookbackDays: number = STAY_FALLBACK_LOOKBACK_DAYS
): Promise<boolean> {
  const result = await findSingleRecentEligibleStay(propertyId, lookbackDays);
  return result.status === 'READY';
}

async function mintStayGuestActions(
  property: { id: string; guestDisplayName: string | null },
  jobId: string,
  dayKey: string
): Promise<StayResolveResult> {
  const ensured = await ensureGuestServiceFeedbackForJob(jobId);

  const tipGrant = await mintGuestTipAuthorization({
    jobId,
    propertyId: property.id,
    replaceActive: true,
  });
  const propertyLabel = guestFacingDisplayName(property.guestDisplayName);

  if (tipGrant.status !== 'MINTED' && tipGrant.status !== 'REISSUED') {
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
    serviceDate: dayKey,
  };
}

function normalizeResolveInput(
  input: string | StayResolveRequest
): StayResolveRequest {
  if (typeof input === 'string') {
    return { checkoutDate: input };
  }
  return input ?? {};
}

/**
 * Resolve guest stay to feedback + tip grant.
 * Accepts legacy `checkoutDate` string or `{ checkoutDate }` / `{ mode: SINGLE_RECENT_ELIGIBLE }`.
 * Never accepts client-supplied jobId.
 */
export async function resolveStayToGuestFeedback(
  opaqueToken: string,
  input: string | StayResolveRequest
): Promise<StayResolveResult> {
  const req = normalizeResolveInput(input);
  const hasDate =
    typeof req.checkoutDate === 'string' && req.checkoutDate.trim().length > 0;
  const wantsFallback = req.mode === STAY_RESOLVE_MODE_SINGLE_RECENT;

  if (hasDate && wantsFallback) {
    return {
      ok: false,
      code: 'INVALID_REQUEST',
      message: 'Choose either a checkout date or the not-sure path — not both.',
    };
  }

  if (!hasDate && !wantsFallback) {
    return {
      ok: false,
      code: 'INVALID_DATE',
      message: 'Enter a valid checkout date (YYYY-MM-DD).',
    };
  }

  if (req.mode != null && req.mode !== STAY_RESOLVE_MODE_SINGLE_RECENT) {
    return {
      ok: false,
      code: 'INVALID_REQUEST',
      message: 'Unsupported resolve mode.',
    };
  }

  const property = await findActivePropertyByGuestToken(opaqueToken);
  if (!property) {
    return {
      ok: false,
      code: 'INVALID_TOKEN',
      message: 'This stay link is invalid or no longer active.',
    };
  }

  if (wantsFallback) {
    const eligible = await findSingleRecentEligibleStay(property.id);
    if (eligible.status === 'AMBIGUOUS_DAY') {
      return {
        ok: false,
        code: 'AMBIGUOUS',
        message:
          'We need help matching this stay. Please contact VelocityMaid for assistance.',
      };
    }
    if (eligible.status !== 'READY') {
      return {
        ok: false,
        code: 'FALLBACK_NOT_AVAILABLE',
        message:
          'We can’t identify your stay automatically. Enter your checkout date, or contact VelocityMaid for help.',
      };
    }
    return mintStayGuestActions(property, eligible.jobId, eligible.dayKey);
  }

  const matched = await findCompletedJobsForStayDay(
    property.id,
    req.checkoutDate!.trim()
  );
  if (!matched) {
    return {
      ok: false,
      code: 'INVALID_DATE',
      message: 'Enter a valid checkout date (YYYY-MM-DD).',
    };
  }

  if (matched.jobs.length === 0) {
    // Privacy: never disclose which dates are real bookings.
    return {
      ok: false,
      code: 'NO_MATCH',
      message:
        'We couldn’t match a completed clean for that date. Double-check the date, try again later if the clean isn’t marked complete yet, or contact VelocityMaid for help.',
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
  return mintStayGuestActions(property, job.id, matched.dayKey);
}
