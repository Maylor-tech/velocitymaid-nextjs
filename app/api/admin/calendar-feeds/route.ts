export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { addPropertyFeed, toFeedView } from '@/lib/calendarSync/feedService';
import { syncCalendarFeed } from '@/lib/calendarSync/syncFeed';

/** Owner-level admin only: feed links are private capabilities across all clients. */
async function requireOwnerAdmin(req: NextRequest) {
  const auth = await requireRole(req, 'ADMIN');
  if (auth.branchId) {
    throw NextResponse.json({ success: false, error: 'Not available for branch-scoped admins' }, { status: 403 });
  }
  return auth;
}

/** GET: every connected calendar, plus host properties for the "connect" form. */
export async function GET(req: NextRequest) {
  try {
    await requireOwnerAdmin(req);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const [feeds, properties] = await Promise.all([
      prisma.propertyCalendarFeed.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { Events: { where: { status: 'ACTIVE', endDate: { gte: today } } } } },
          Property: {
            select: { name: true, address: true, Customer: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      prisma.property.findMany({
        where: { OR: [{ useType: null }, { useType: { not: 'RESIDENTIAL' } }] },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, address: true, Customer: { select: { firstName: true, lastName: true } } },
        take: 500,
      }),
    ]);
    return NextResponse.json({
      success: true,
      feeds: feeds.map((f) => ({
        ...toFeedView(f),
        propertyName: f.Property.name,
        propertyAddress: f.Property.address,
        customerName: `${f.Property.Customer.firstName} ${f.Property.Customer.lastName}`.trim(),
      })),
      properties: properties.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        customerName: `${p.Customer.firstName} ${p.Customer.lastName}`.trim(),
      })),
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('[admin/calendar-feeds GET]', err);
    return NextResponse.json({ success: false, error: 'Failed to load calendars' }, { status: 500 });
  }
}

/** POST { propertyId, url, label? }: connect on a host's behalf, then first sync. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireOwnerAdmin(req);
    const body = await req.json().catch(() => ({}));
    const propertyId = typeof body?.propertyId === 'string' ? body.propertyId : '';
    const property = propertyId
      ? await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } })
      : null;
    if (!property) return NextResponse.json({ success: false, error: 'Choose a property' }, { status: 400 });

    const added = await addPropertyFeed({
      propertyId: property.id,
      url: body?.url,
      label: body?.label,
      createdBy: `admin:${auth.email || auth.userId}`,
    });
    if ('error' in added) return NextResponse.json({ success: false, error: added.error }, { status: added.status });
    const sync = await syncCalendarFeed(added.feed.id);
    return NextResponse.json({ success: true, feedId: added.feed.id, sync });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('[admin/calendar-feeds POST]', err);
    return NextResponse.json({ success: false, error: 'Failed to connect calendar' }, { status: 500 });
  }
}
