export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get Assignment Logs API
 * GET /api/admin/jobs/[jobId]/assignment-log
 * 
 * Returns assignment logs for a job (latest 5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const logs = await prisma.assignmentLog.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      jobId: log.jobId,
      cleanerId: log.cleanerId,
      branchId: log.branchId,
      branch: log.Branch,
      outcome: log.outcome,
      reason: log.reason,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
    });
  } catch (error: any) {
    console.error('Error fetching assignment logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch assignment logs',
      },
      { status: 500 }
    );
  }
}

