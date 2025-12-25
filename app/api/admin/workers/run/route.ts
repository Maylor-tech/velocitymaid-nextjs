export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';
import { runFullOpsJob } from '@/lib/workers/opsWorkers';
import { logAuditEntry } from '@/lib/audit';

/**
 * POST /api/admin/workers/run
 * 
 * Triggers a full operations job for a branch
 * 
 * Body: { branchId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add proper admin authentication check
    // For now, allow in development mode
    if (process.env.NODE_ENV === 'production' && process.env.APP_ENV !== 'development') {
      // In production, check for admin role
      // const session = await getServerSession();
      // if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      // }
    }

    const body = await request.json();
    const { branchId: providedBranchId } = body;

    // Determine branch
    let branchId = providedBranchId;

    if (!branchId) {
      // Try to find new-jersey branch
      let branch = await prisma.branch.findFirst({
        where: {
          slug: 'new-jersey',
          status: 'ACTIVE',
        },
      });

      if (!branch) {
        branch = await prisma.branch.findFirst({
          where: {
            status: 'ACTIVE',
          },
        });
      }

      if (!branch) {
        return NextResponse.json(
          { error: 'No active branch found' },
          { status: 404 }
        );
      }

      branchId = branch.id;
    }

    const startedAt = new Date();

    // Run the full ops job
    const result = await runFullOpsJob(branchId);

    const finishedAt = new Date();

    // Log to WorkerRunLog
    try {
      await prisma.workerRunLog.create({
        data: {
          branchId,
          jobType: 'ops-full',
          startedAt,
          finishedAt,
          durationMs: result.durationMs,
          status: result.success ? 'SUCCESS' : 'FAILED',
          error: result.success ? null : (result as any).error,
        },
      });
    } catch (logError) {
      console.error('Failed to log worker run:', logError);
      // Don't fail the request if logging fails
    }

    // Log audit entry
    await logAuditEntry({
      actorId: null, // TODO: Get from session
      actorRole: 'ADMIN',
      action: 'WORKER_JOB_RUN',
      entityType: 'Branch',
      entityId: branchId,
      description: `Full ops job executed for branch ${branchId}`,
      changes: {
        metrics: result.metrics,
        cleanerLevels: result.cleanerLevels,
        integrity: result.integrity,
      },
    });

    return NextResponse.json({
      success: true,
      branchId,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: result.durationMs,
      metrics: result.metrics,
      cleanerLevels: result.cleanerLevels,
      integrity: result.integrity,
    });
  } catch (error: any) {
    console.error('Worker run error:', error);

    // If it's our structured error from runFullOpsJob
    if (error.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: error.error,
          durationMs: error.durationMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}


















