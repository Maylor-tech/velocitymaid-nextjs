/**
 * Admin Script: Assign Cleaner to Completed Job
 * 
 * POST /api/admin/scripts/assign-cleaner
 * 
 * Quick one-time script to assign a cleaner to a completed job.
 */

import { NextRequest, NextResponse } from "next/server";
import { assignCleanerToJob } from "@/scripts/assign-cleaner-to-job";
import { requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // For now, allow in development mode

    const result = await assignCleanerToJob();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        jobId: result.jobId,
        cleanerId: result.cleanerId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to assign cleaner",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[ASSIGN_CLEANER_API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assign cleaner",
      },
      { status: 500 }
    );
  }
}

