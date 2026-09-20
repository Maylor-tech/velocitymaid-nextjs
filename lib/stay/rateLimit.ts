/**
 * In-memory rate limit for public stay resolve (IP + token).
 * Same pattern as customer-magic-link; suitable for single-instance / Preview.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;

export function checkStayResolveRateLimit(key: string): boolean {
  const now = Date.now();
  const record = buckets.get(key);

  if (!record || now > record.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

/** Test helper */
export function _resetStayResolveRateLimitForTests(): void {
  buckets.clear();
}
