export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

// GET /api/admin/audit/logs
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const actorId = searchParams.get('actorId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (actorId) {
      where.actorId = actorId;
    }

    if (action) {
      where.action = action;
    }

    // Get audit logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Format logs
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorName: log.User?.name || 'System',
      actorEmail: log.User?.email || null,
      actorRole: log.actorRole || log.User?.role || null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      changes: log.changes,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length,
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get audit logs',
      },
      { status: 500 }
    );
  }
}








