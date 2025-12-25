/**
 * Phase M: Cancellation Window API
 * 
 * GET /api/pilot/cancellation-window?jobId=xxx
 * 
 * Get cancellation window information for a job.
 * Shows customer what fees apply if they cancel.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getCancellationWindow } from "@/lib/pilot/customerExperience";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Allow customer, branch owner, admin, or support
    await requireRole(request, ["ADMIN", "BRANCH_OWNER", "CUSTOMER", "SUPPORT"]);

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

    const window = await getCancellationWindow(jobId);

    return NextResponse.json({
      success: true,
      cancellationWindow: window,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[PILOT_CANCELLATION_WINDOW] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get cancellation window",
      },
      { status: 500 }
    );
  }
}













