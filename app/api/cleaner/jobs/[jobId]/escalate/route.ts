/**
 * Phase M: Cleaner Escalation API
 * 
 * POST /api/cleaner/jobs/[jobId]/escalate
 * 
 * Cleaner escalates an issue with a job to admin.
 * "If issue → Escalate to Admin (not WhatsApp chaos)"
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";
import { escalateJobIssue } from "@/lib/pilot/dayOfJob";
import { createAdminNotification, adminNotificationHelpers } from "@/lib/notifications/adminNotificationCenter";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    
    // Verify cleaner is assigned to this job
    await requireCleanerJobAssignment(req, jobId);
    
    // Authenticate cleaner
    const authResult = await getAuthenticatedCleaner(req);
    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { error: authResult.error || "Not authenticated as cleaner" },
        { status: 401 }
      );
    }

    const cleanerId = authResult.cleanerId;
    const body = await req.json();
    const { issueType, reason, notes } = body;

    // Validate required fields
    if (!issueType || !reason) {
      return NextResponse.json(
        { error: "issueType and reason are required" },
        { status: 400 }
      );
    }

    // Validate issue type
    const validIssueTypes = [
      "CLEANER_ISSUE",
      "JOB_DISPUTE",
      "CUSTOMER_COMPLAINT",
      "TECHNICAL_ISSUE",
    ];
    if (!validIssueTypes.includes(issueType)) {
      return NextResponse.json(
        {
          error: `Invalid issueType. Must be one of: ${validIssueTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create escalation
    const escalation = await escalateJobIssue(
      jobId,
      issueType,
      "CLEANER",
      cleanerId,
      reason,
      notes
    );

    if (!escalation.success) {
      return NextResponse.json(
        { error: escalation.error || "Failed to escalate issue" },
        { status: 500 }
      );
    }

    createAdminNotification({
      type: "JOB_ISSUE_REPORTED",
      severity: issueType === "TECHNICAL_ISSUE" ? "INFO" : "CRITICAL",
      message: `Cleaner reported ${issueType.replace(/_/g, " ").toLowerCase()} on job ${jobId}: ${reason}`,
      jobId,
      actionUrl: adminNotificationHelpers.adminJobLink(jobId),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      escalationId: escalation.escalationId,
      message: "Issue escalated successfully. An administrator will review it shortly.",
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[CLEANER_ESCALATE] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to escalate issue",
      },
      { status: 500 }
    );
  }
}













