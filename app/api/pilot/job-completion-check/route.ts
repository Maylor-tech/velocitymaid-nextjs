/**
 * Phase M: Job Completion Check API
 * 
 * GET /api/pilot/job-completion-check?jobId=xxx
 * 
 * Check job completion integrity (for admin/debugging).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { verifyJobCompletion } from "@/lib/pilot/dayOfJob";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["ADMIN", "BRANCH_OWNER"]);

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "jobId is required",
        },
        { status: 400 }
      );
    }

    const check = await verifyJobCompletion(jobId);

    return NextResponse.json({
      success: true,
      check,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[PILOT_JOB_COMPLETION_CHECK] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check job completion",
      },
      { status: 500 }
    );
  }
}










