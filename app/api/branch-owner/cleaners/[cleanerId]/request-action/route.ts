/**
 * POST /api/branch-owner/cleaners/[cleanerId]/request-action
 * 
 * Branch owner requests an action on a cleaner (suspension, reassignment)
 * This creates a request that admin must approve
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getAuthenticatedBranchOwner } from "@/lib/auth/branchOwnerAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
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

    const { cleanerId } = params;
    const body = await request.json();
    const { actionType, reason, notes } = body;

    // Validate required fields
    if (!actionType || !reason) {
      return NextResponse.json(
        { success: false, error: "actionType and reason are required" },
        { status: 400 }
      );
    }

    // Validate action type
    const validActionTypes = ["SUSPEND", "REASSIGN", "FLAG_FOR_REVIEW"];
    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        { success: false, error: `Invalid actionType. Must be one of: ${validActionTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify cleaner is assigned to branch owner's branch
    const cleaner = await prisma.user.findFirst({
      where: {
        id: cleanerId,
        role: "CLEANER",
        UserBranch: {
          some: {
            branchId: authResult.branchId,
          },
        },
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: "Cleaner not found or not assigned to your branch" },
        { status: 404 }
      );
    }

    // Create action request (via audit log)
    const actionRequest = await prisma.auditLog.create({
      data: {
        entityType: "CleanerActionRequest",
        entityId: cleanerId,
        action: `BRANCH_OWNER_REQUEST_${actionType}`,
        actorRole: "BRANCH_OWNER",
        actorId: authResult.branchOwnerId,
        description: `Branch owner requested ${actionType} for cleaner ${cleanerId}`,
        changes: {
          actionType,
          reason,
          notes: notes || null,
          branchId: authResult.branchId,
          cleanerId,
          status: "PENDING_ADMIN_APPROVAL",
        },
      },
    });

    // TODO: Send notification to admin
    // This could be email, in-app notification, or webhook

    return NextResponse.json({
      success: true,
      request: {
        id: actionRequest.id,
        actionType,
        reason,
        status: "PENDING_ADMIN_APPROVAL",
        createdAt: actionRequest.createdAt.toISOString(),
      },
      message: `Request submitted. An administrator will review your ${actionType.toLowerCase()} request.`,
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[BRANCH_OWNER_CLEANER_ACTION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to request action",
      },
      { status: 500 }
    );
  }
}













