export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { autoAssignCleaner } from '@/lib/cleaner-assignment';

/**
 * Manual Auto-Assignment Trigger
 * 
 * POST /api/admin/jobs/auto-assign
 * 
 * Body: { jobId: string }
 * 
 * Manually triggers auto-assignment for a specific job
 * Useful for admin dashboard or manual intervention
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'jobId is required',
        },
        { status: 400 }
      );
    }

    // Call autoAssignCleaner
    const result = await autoAssignCleaner(jobId);

    return NextResponse.json({
      success: result.success,
      cleanerId: result.cleanerId,
      cleanerName: result.cleanerName,
      reason: result.reason,
    });
  } catch (error: unknown) {
    console.error('Error in auto-assign endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

