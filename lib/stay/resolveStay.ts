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
    return {
      ok: false,
      code: 'NO_MATCH',
      message:
        'We couldn’t match a completed clean for that date. Double-check the checkout date or contact VelocityMaid.',
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
  const tipGrant = await mintGuestTipAuthorization({
    jobId: job.id,
    propertyId: property.id,
  });
  const propertyLabel = guestFacingDisplayName(property.guestDisplayName);

  return {
    ok: true,
    feedbackToken: ensured.feedbackToken,
    feedbackUrl: ensured.feedbackUrl || feedbackPublicUrl(ensured.feedbackToken),
    tipGrantToken: tipGrant.grantToken,
    tipUrl: tipGrant.tipUrl,
    propertyLabel,
    serviceDate: matched.dayKey,
  };
}
