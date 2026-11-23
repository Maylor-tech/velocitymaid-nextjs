export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { syncCalendarFeed } from '@/lib/calendarSync/syncFeed';

type RouteContext = { params: { feedId: string } };

/** POST: sync one calendar now. */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireRole(req, 'ADMIN');
    if (auth.branchId) {
      return NextResponse.json({ success: false, error: 'Not available for branch-scoped admins' }, { status: 403 });
    }
    const sync = await syncCalendarFeed(params.feedId);
    return NextResponse.json({ success: sync.ok, sync, error: sync.error });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('[admin/calendar-feeds sync]', err);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
