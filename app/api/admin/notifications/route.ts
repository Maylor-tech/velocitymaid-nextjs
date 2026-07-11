export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/notifications?status=OPEN&severity=CRITICAL&limit=50
 * PATCH /api/admin/notifications  Body: { id: string, status: "ACKNOWLEDGED" } | { markAllRead: true }
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

    const notifications = await prisma.adminNotification.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.adminNotification.count({
      where: { readAt: null },
    });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load notifications';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();

    if (body.markAllRead) {
      await prisma.adminNotification.updateMany({
        where: { readAt: null },
        data: { readAt: new Date(), status: 'ACKNOWLEDGED' },
      });
      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const notification = await prisma.adminNotification.update({
      where: { id: body.id },
      data: {
        readAt: new Date(),
        status: body.status === 'OPEN' ? 'OPEN' : 'ACKNOWLEDGED',
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update notification';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
