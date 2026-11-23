export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { loadOwnedProperty } from '@/lib/properties/propertyService';
import { listPropertyFeeds } from '@/lib/calendarSync/feedService';
import { syncCalendarFeed } from '@/lib/calendarSync/syncFeed';

type RouteContext = { params: { propertyId: string; feedId: string } };
const MIN_GAP_MS = 2 * 60 * 1000;

/** POST: "Sync now". Limited to once every two minutes per calendar. */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    const property = await loadOwnedProperty(prisma, params.propertyId, session.customerId);
    if (!property) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    const feed = await prisma.propertyCalendarFeed.findFirst({
      where: { id: params.feedId, propertyId: property.id },
      select: { id: true, lastSyncedAt: true },
    });
    if (!feed) return NextResponse.json({ success: false, error: 'Calendar not found' }, { status: 404 });

    let sync = null;
    if (!feed.lastSyncedAt || Date.now() - feed.lastSyncedAt.getTime() > MIN_GAP_MS) {
      sync = await syncCalendarFeed(feed.id);
    }
    const feeds = await listPropertyFeeds(property.id);
    return NextResponse.json({
      success: true,
      feed: feeds.find((f) => f.id === feed.id) ?? null,
      sync: sync ? { ok: sync.ok, created: sync.created + sync.linked, error: sync.error ?? null } : null,
    });
  } catch (error) {
    console.error('[customer/calendar-feeds sync]', error);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
