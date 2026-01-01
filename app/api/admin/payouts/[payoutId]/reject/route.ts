/**
 * POST /api/admin/payouts/[payoutId]/reject
 * 
 * Admin rejects a PENDING payout
 * - Sets status to REJECTED
 * - Stores rejection reason in adminDecision (policyEvalDetails)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const payoutId = params.payoutId;
    const rejectionTimestamp = new Date();

    const body = await request.json().catch(() => ({}));
    const { rejectionReason } = body;

    const payout = await prisma.jobPayout.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        jobId: true,
        cleanerId: true,
        status: true,
        policyEvalDetails: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    if (payout.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reject payout with status ${payout.status}. Only PENDING payouts can be rejected.`,
        },
        { status: 400 }
      );
    }

    const previousStatus = payout.status;
    const existingDetails = (payout.policyEvalDetails as any) || {};
    const updatedDetails = {
      ...existingDetails,
      adminDecision: {
        action: "REJECTED",
        timestamp: rejectionTimestamp.toISOString(),
        adminId: auth.userId,
        reason: rejectionReason || null,
      },
    };

    const updated = await prisma.jobPayout.update({
      where: { id: payoutId },
      data: {
        status: "REJECTED",
        policyEvalDetails: updatedDetails,
      },
      select: {
        id: true,
        jobId: true,
        status: true,
        policyEvalDetails: true,
      },
    });

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: "ADMIN",
      action: "PAYOUT_REJECTED",
      entityType: "JobPayout",
      entityId: payoutId,
      description: `Payout rejected for job ${payout.jobId}${rejectionReason ? `: ${rejectionReason}` : ""}`,
      changes: {
        previousStatus,
        newStatus: "REJECTED",
        payoutId,
        jobId: payout.jobId,
        cleanerId: payout.cleanerId,
        reason: rejectionReason || null,
        timestamp: rejectionTimestamp.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      payout: updated,
    });
  } catch (error: any) {
    console.error("[REJECT_PAYOUT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to reject payout",
      },
      { status: 500 }
    );
  }
}

