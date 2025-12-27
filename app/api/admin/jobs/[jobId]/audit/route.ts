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
      const changes = log.changes as any;
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        eventType: log.action,
        adminEmail: changes?.adminEmail || log.actorRole || 'System',
        cleanerId: changes?.cleanerId || null,
        cleanerName: null, // Will be fetched separately if needed
        branchId: changes?.branchId || null,
        notes: changes?.notes || log.description || null,
      };
    });

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length,
    });
  } catch (error: any) {
    console.error('Get job audit logs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get audit logs',
      },
      { status: 500 }
    );
  }
}

