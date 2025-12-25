/**
 * Admin Script: Create Payout Policy for New Jersey Branch
 * 
 * POST /api/admin/scripts/create-nj-payout-policy
 * 
 * Creates a payout policy version and assigns it to the New Jersey branch.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { createNJPayoutPolicy } from "@/scripts/create-nj-payout-policy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check
    // For now, allow in development mode

    const result = await createNJPayoutPolicy();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        policyVersionId: result.policyVersionId,
        branchId: result.branchId,
        assignmentId: result.assignmentId,
        ruleId: result.ruleId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to create payout policy",
          ...(result.policyVersionId && {
            existingPolicyVersionId: result.policyVersionId,
            existingAssignmentId: result.assignmentId,
          }),
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[CREATE_PAYOUT_POLICY_API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create payout policy",
      },
      { status: 500 }
    );
  }
}














