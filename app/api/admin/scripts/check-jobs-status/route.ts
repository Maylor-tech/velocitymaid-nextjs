/**
 * Admin Script: Check Jobs Status
 * 
 * GET /api/admin/scripts/check-jobs-status
 * 
 * Diagnostic endpoint to see what jobs exist and their status.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { checkJobsStatus } from "@/scripts/check-jobs-status";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const result = await checkJobsStatus();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[CHECK_JOBS_STATUS_API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check jobs status",
      },
      { status: 500 }
    );
  }
}














