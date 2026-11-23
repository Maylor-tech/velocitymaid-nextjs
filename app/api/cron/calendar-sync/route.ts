export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Booking-calendar sync (Cron)
 * GET /api/cron/calendar-sync
 *
 * Reads every active Airbnb / VRBO calendar link and turns new checkouts into
 * turnover requests for ops to confirm. Requires CRON_SECRET.
 * Vercel schedule: daily (Hobby plan limit). For more frequent checks, call this
 * endpoint from an external scheduler with the same bearer secret.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import { syncAllCalendarFeeds } from '@/lib/calendarSync/syncFeed';

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;
  try {
    const results = await syncAllCalendarFeeds();
    const totals = results.reduce(
      (t, r) => ({
        feeds: t.feeds + 1,
        failed: t.failed + (r.ok ? 0 : 1),
        created: t.created + r.created,
        moved: t.moved + r.moved,
        removed: t.removed + r.removed,
      }),
      { feeds: 0, failed: 0, created: 0, moved: 0, removed: 0 }
    );
    console.log('[cron/calendar-sync]', totals);
    return NextResponse.json({ success: true, ...totals });
  } catch (error) {
    console.error('[cron/calendar-sync]', error);
    return NextResponse.json({ success: false, error: 'Calendar sync failed' }, { status: 500 });
  }
}
