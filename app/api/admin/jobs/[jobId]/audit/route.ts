export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Phase 2B: Get Audit Logs for a Job
 * GET /api/admin/jobs/[jobId]/audit]
 * 
 * Returns audit log entries for a specific job
 * Phase 2B scope: Read-only, append-only - no editing or deletion
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const jobId = params.jobId;

    // Phase 2B: Fetch audit logs for this job
    // Why audit logs exist: Track admin actions for compliance and debugging
    // Scope: Read-only - we only fetch, never modify or delete
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Job',
        entityId: jobId,
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
      take: 100, // Limit to recent 100 entries
    });

    // Format logs for UI display
    const formattedLogs = logs.map((log) => {
      const changes =
        log.changes && typeof log.changes === 'object' && !Array.isArray(log.changes)
          ? (log.changes as Record<string, unknown>)
          : {};
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        eventType: log.action,
        adminEmail:
          typeof changes.adminEmail === 'string'
            ? changes.adminEmail
            : log.actorRole || 'System',
        cleanerId: typeof changes.cleanerId === 'string' ? changes.cleanerId : null,
        cleanerName: null,
        branchId: typeof changes.branchId === 'string' ? changes.branchId : null,
        notes:
          typeof changes.notes === 'string'
            ? changes.notes
            : log.description || null,
      };
    });

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Get job audit logs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get audit logs',
      },
      { status: 500 }
    );
  }
}

