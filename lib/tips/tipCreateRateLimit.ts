/**
 * Durable rate limit for guest tip create (grant consumption).
 * Reuses ApiRateLimitBucket; separate key namespace from stay-resolve.
 */

import { prisma } from '@/lib/prisma';

export const TIP_CREATE_WINDOW_MS = 60 * 60 * 1000;
export const TIP_CREATE_MAX_PER_WINDOW = 20;

const KEY_PREFIX = 'tip-create:';

function scopedKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

export async function checkTipCreateRateLimit(key: string): Promise<boolean> {
  const bucketKey = scopedKey(key);
  const now = new Date();
  const resetAt = new Date(now.getTime() + TIP_CREATE_WINDOW_MS);

  try {
    await prisma.apiRateLimitBucket.create({
      data: { bucketKey, count: 1, resetAt },
    });
    return true;
  } catch {
    // unique conflict
  }

  const reset = await prisma.apiRateLimitBucket.updateMany({
    where: { bucketKey, resetAt: { lte: now } },
    data: { count: 1, resetAt },
  });
  if (reset.count === 1) return true;

  const inc = await prisma.apiRateLimitBucket.updateMany({
    where: {
      bucketKey,
      resetAt: { gt: now },
      count: { lt: TIP_CREATE_MAX_PER_WINDOW },
    },
    data: { count: { increment: 1 } },
  });

  return inc.count === 1;
}
