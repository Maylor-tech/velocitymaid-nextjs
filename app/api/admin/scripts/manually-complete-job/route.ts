/**
 * Admin Script: Manually Complete a Job
 * 
 * POST /api/admin/scripts/manually-complete-job
 * 
 * Marks a job as COMPLETED for testing purposes.
 * 
 * Body: { jobId?: string } // Optional - if not provided, finds first eligible job
 */

import { NextRequest, NextResponse } from "next/server";
import { manuallyCompleteJob } from "@/scripts/manually-complete-job";
import { requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { jobId } = body;

    const result = await manuallyCompleteJob(jobId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        jobId: result.jobId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to complete job",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error("[MANUAL_COMPLETE_JOB_API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to complete job",
      },
      { status: 500 }
    );
  }
}

