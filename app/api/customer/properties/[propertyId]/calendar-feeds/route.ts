export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { loadOwnedProperty } from '@/lib/properties/propertyService';
import { addPropertyFeed, listPropertyFeeds } from '@/lib/calendarSync/feedService';
import { syncCalendarFeed } from '@/lib/calendarSync/syncFeed';

type RouteContext = { params: { propertyId: string } };

async function owned(propertyId: string) {
  const session = await getCustomerSession();
  if (!session) return { error: NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 }) };
  const property = await loadOwnedProperty(prisma, propertyId, session.customerId);
  if (!property) return { error: NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 }) };
  return { session, property };
}

/** GET: this property's connected booking calendars (links masked). */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const o = await owned(params.propertyId);
    if ('error' in o) return o.error;
    return NextResponse.json({ success: true, feeds: await listPropertyFeeds(o.property.id) });
  } catch (error) {
    console.error('[customer/calendar-feeds GET]', error);
    return NextResponse.json({ success: false, error: 'Could not load calendars' }, { status: 500 });
  }
}

/** POST { url, label? }: connect a calendar, then run a first sync. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const o = await owned(params.propertyId);
    if ('error' in o) return o.error;
    const body = await request.json().catch(() => ({}));
    const added = await addPropertyFeed({
      propertyId: o.property.id,
      url: body?.url,
      label: body?.label,
      createdBy: `customer:${o.session.customerId}`,
    });
    if ('error' in added) return NextResponse.json({ success: false, error: added.error }, { status: added.status });

    const sync = await syncCalendarFeed(added.feed.id);
    const feeds = await listPropertyFeeds(o.property.id);
    return NextResponse.json({
      success: true,
      feed: feeds.find((f) => f.id === added.feed.id) ?? added.feed,
      firstSync: { ok: sync.ok, created: sync.created + sync.linked, error: sync.error ?? null },
    });
  } catch (error) {
    console.error('[customer/calendar-feeds POST]', error);
    return NextResponse.json({ success: false, error: 'Could not connect the calendar' }, { status: 500 });
  }
}
