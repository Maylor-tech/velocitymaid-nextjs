/**
 * Durable stay-resolve rate limit via Postgres (shared across Vercel instances).
 * No Redis/Upstash in this repo — Prisma/Postgres is the existing shared store.
 *
 * Semantics: fixed 1-hour window, max 10 attempts per key (IP + token prefix).
 */

import { prisma } from '@/lib/prisma';

export const STAY_RESOLVE_WINDOW_MS = 60 * 60 * 1000;
export const STAY_RESOLVE_MAX_PER_WINDOW = 10;

const KEY_PREFIX = 'stay-resolve:';

function scopedKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

/**
 * Returns true if the request is allowed; false when over limit (429).
 * Atomic enough for serverless: conditional updateMany increments under the cap.
 */
export async function checkStayResolveRateLimit(key: string): Promise<boolean> {
  const bucketKey = scopedKey(key);
  const now = new Date();
  const resetAt = new Date(now.getTime() + STAY_RESOLVE_WINDOW_MS);

  try {
    await prisma.apiRateLimitBucket.create({
      data: {
        bucketKey,
        count: 1,
        resetAt,
      },
    });
    return true;
  } catch {
    // Unique conflict — bucket already exists
  }

  const reset = await prisma.apiRateLimitBucket.updateMany({
    where: {
      bucketKey,
      resetAt: { lte: now },
    },
    data: {
      count: 1,
      resetAt,
    },
  });
  if (reset.count === 1) {
    return true;
  }

  const inc = await prisma.apiRateLimitBucket.updateMany({
    where: {
      bucketKey,
      resetAt: { gt: now },
      count: { lt: STAY_RESOLVE_MAX_PER_WINDOW },
    },
    data: {
      count: { increment: 1 },
    },
  });

  return inc.count === 1;
}

/** Test helper — clears stay-resolve buckets (and only those). */
export async function _resetStayResolveRateLimitForTests(): Promise<void> {
  await prisma.apiRateLimitBucket.deleteMany({
    where: { bucketKey: { startsWith: KEY_PREFIX } },
  });
}
