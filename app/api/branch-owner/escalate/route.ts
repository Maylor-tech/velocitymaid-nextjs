/**
 * POST /api/branch-owner/escalate
 * 
 * Branch owner escalates an issue to admin
 * Requires reason and optional notes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getAuthenticatedBranchOwner } from "@/lib/auth/branchOwnerAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Authenticate as branch owner
    await requireRole(request, "BRANCH_OWNER");
    const authResult = await getAuthenticatedBranchOwner(request);
    
    if (!authResult.success || !authResult.branchId || !authResult.branchOwnerId) {
      return NextResponse.json(
        { success: false, error: "Branch owner not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { issueType, reason, notes, relatedJobId, relatedCleanerId, relatedCustomerId } = body;

    // Validate required fields
    if (!issueType || !reason) {
      return NextResponse.json(
        { success: false, error: "issueType and reason are required" },
        { status: 400 }
      );
    }

    // Validate issue type
    const validIssueTypes = ["JOB_DISPUTE", "CLEANER_ISSUE", "CUSTOMER_COMPLAINT", "OTHER"];
    if (!validIssueTypes.includes(issueType)) {
      return NextResponse.json(
        { success: false, error: `Invalid issueType. Must be one of: ${validIssueTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Create escalation record
    // Note: This assumes an Escalation model exists. If not, we can use AuditLog or create a new model
    const escalation = await prisma.auditLog.create({
      data: {
        entityType: "Escalation",
        entityId: `esc_${Date.now()}`,
        action: "ESCALATION_CREATED",
        actorRole: "BRANCH_OWNER",
        actorId: authResult.branchOwnerId,
        description: `Escalation: ${issueType} - ${reason}`,
        changes: {
          issueType,
          reason,
          notes: notes || null,
          branchId: authResult.branchId,
          relatedJobId: relatedJobId || null,
          relatedCleanerId: relatedCleanerId || null,
          relatedCustomerId: relatedCustomerId || null,
        },
      },
    });

    // TODO: Send notification to admin
    // This could be:
    // - Email notification
    // - In-app notification
    // - WhatsApp message
    // - Slack webhook

    return NextResponse.json({
      success: true,
      escalation: {
        id: escalation.id,
        issueType,
        reason,
        createdAt: escalation.createdAt.toISOString(),
      },
      message: "Issue escalated successfully. An administrator will review it shortly.",
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[BRANCH_OWNER_ESCALATE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to escalate issue",
      },
      { status: 500 }
    );
  }
}














