/**
 * Phase M: Assignment SLA API
 * 
 * GET /api/pilot/assignment-sla?jobId=xxx
 * GET /api/pilot/assignment-sla?branchId=xxx (queue)
 * GET /api/pilot/assignment-sla?branchId=xxx&violations=true
 * 
 * Track assignment SLA and violations
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import {
  getAssignmentSLAStatus,
  getAssignmentQueue,
  getSLAViolations,
} from "@/lib/pilot/assignmentSLA";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["ADMIN", "BRANCH_OWNER"]);

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const branchId = searchParams.get("branchId");
    const violations = searchParams.get("violations") === "true";
    const queue = searchParams.get("queue") === "true";

    // Get SLA status for a specific job
    if (jobId) {
      const slaStatus = await getAssignmentSLAStatus(jobId);
      return NextResponse.json({
        success: true,
        slaStatus,
      });
    }

    // Get assignment queue for a branch
    if (branchId && queue) {
      const queueItems = await getAssignmentQueue(branchId);
      return NextResponse.json({
        success: true,
        queue: queueItems,
        count: queueItems.length,
        violations: queueItems.filter((item) => item.slaStatus === "violated").length,
        pending: queueItems.filter((item) => item.slaStatus === "pending").length,
      });
    }

    // Get SLA violations for a branch
    if (branchId && violations) {
      const hours = parseInt(searchParams.get("hours") || "24", 10);
      const violationList = await getSLAViolations(branchId, hours);
      return NextResponse.json({
        success: true,
        violations: violationList,
        count: violationList.length,
        hours,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Provide jobId, or branchId with queue=true, or branchId with violations=true",
      },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[PILOT_ASSIGNMENT_SLA] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get assignment SLA",
      },
      { status: 500 }
    );
  }
}



