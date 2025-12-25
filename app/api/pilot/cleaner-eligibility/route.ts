/**
 * Phase M: Cleaner Eligibility Check API
 * 
 * GET /api/pilot/cleaner-eligibility?cleanerId=xxx
 * 
 * Check if a cleaner is eligible for job assignment.
 * Used by Branch Owner and Admin UIs before assignment.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { checkCleanerAssignmentEligibility } from "@/lib/pilot/cleanerValidation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Require admin or branch owner
    await requireRole(request, ["ADMIN", "BRANCH_OWNER"]);

    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get("cleanerId");

    if (!cleanerId) {
      return NextResponse.json(
        {
          success: false,
          error: "cleanerId is required",
        },
        { status: 400 }
      );
    }

    const eligibility = await checkCleanerAssignmentEligibility(cleanerId);

    return NextResponse.json({
      success: true,
      eligibility,
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[PILOT_CLEANER_ELIGIBILITY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check cleaner eligibility",
      },
      { status: 500 }
    );
  }
}












