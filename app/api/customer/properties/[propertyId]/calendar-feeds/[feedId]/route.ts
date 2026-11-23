export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { loadOwnedProperty } from '@/lib/properties/propertyService';
import { removePropertyFeed } from '@/lib/calendarSync/feedService';

type RouteContext = { params: { propertyId: string; feedId: string } };

/** DELETE: disconnect a calendar. Turnovers already requested are kept. */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    const property = await loadOwnedProperty(prisma, params.propertyId, session.customerId);
    if (!property) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    const removed = await removePropertyFeed(params.feedId, property.id);
    if (!removed) return NextResponse.json({ success: false, error: 'Calendar not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[customer/calendar-feeds DELETE]', error);
    return NextResponse.json({ success: false, error: 'Could not disconnect the calendar' }, { status: 500 });
  }
}
