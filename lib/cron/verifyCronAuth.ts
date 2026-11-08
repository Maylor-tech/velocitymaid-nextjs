import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function bearerMatches(header: string | null, secret: string): boolean {
  const actual = Buffer.from(header ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/**
 * Fail closed. A missing, empty, or wrong bearer token is the same 401.
 * The response does not say whether CRON_SECRET is configured.
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret == null || cronSecret.trim() === '') return unauthorized();

  const authHeader = request.headers.get('authorization');
  if (!bearerMatches(authHeader, cronSecret)) return unauthorized();
  return null;
}
