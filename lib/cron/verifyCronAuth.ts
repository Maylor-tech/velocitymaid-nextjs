import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function sameSecret(provided: string | null, expected: string): boolean {
  if (provided == null) return false;
  const actual = Buffer.from(provided);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

/**
 * Fail closed. A missing, empty, or wrong credential is the same 401.
 * Accepts Authorization: Bearer <CRON_SECRET> or x-cron-secret: <CRON_SECRET>.
 * Query-string secrets are ignored. The response does not say whether the secret is configured.
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret == null || cronSecret.trim() === '') return unauthorized();

  const bearerOk = sameSecret(request.headers.get('authorization'), `Bearer ${cronSecret}`);
  const headerOk = sameSecret(request.headers.get('x-cron-secret'), cronSecret);
  if (!bearerOk && !headerOk) return unauthorized();
  return null;
}
