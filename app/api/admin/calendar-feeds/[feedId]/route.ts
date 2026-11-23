export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';

type RouteContext = { params: { feedId: string } };

async function requireOwnerAdmin(req: NextRequest) {
  const auth = await requireRole(req, 'ADMIN');
  if (auth.branchId) {
    throw NextResponse.json({ success: false, error: 'Not available for branch-scoped admins' }, { status: 403 });
  }
  return auth;
}

/** PATCH { active }: pause or resume syncing. */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await requireOwnerAdmin(req);
    const body = await req.json().catch(() => ({}));
    if (typeof body?.active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'active must be true or false' }, { status: 400 });
    }
    const res = await prisma.propertyCalendarFeed.updateMany({
      where: { id: params.feedId },
      data: { active: body.active },
    });
    if (!res.count) return NextResponse.json({ success: false, error: 'Calendar not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('[admin/calendar-feeds PATCH]', err);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

/** DELETE: disconnect. Turnover jobs already created are kept. */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    await requireOwnerAdmin(req);
    const res = await prisma.propertyCalendarFeed.deleteMany({ where: { id: params.feedId } });
    if (!res.count) return NextResponse.json({ success: false, error: 'Calendar not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error('[admin/calendar-feeds DELETE]', err);
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
