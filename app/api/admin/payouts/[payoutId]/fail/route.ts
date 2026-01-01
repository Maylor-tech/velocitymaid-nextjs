/**
 * POST /api/admin/payouts/[payoutId]/fail
 * 
 * Admin marks a payout as FAILED
 * - Allows APPROVED or SENT -> FAILED transition
 * - Stores executionNote as reason
 * - Audit log
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { notifyPayoutFailed } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const payoutId = params.payoutId;

    const body = await request.json().catch(() => ({}));
    const { note } = body;

    // Validate note length
    if (note && note.length > 500) {
      return NextResponse.json(
        { success: false, error: "note must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Fetch payout
    const payout = await prisma.jobPayout.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        jobId: true,
        cleanerId: true,
        branchId: true,
        status: true,
        cleanerAmount: true,
        currency: true,
        executionNote: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    // Check if already FAILED (idempotency)
    if (payout.status === "FAILED") {
      return NextResponse.json({
        success: true,
        payout: {
          id: payout.id,
          status: payout.status,
          executionNote: payout.executionNote,
        },
        message: "Payout is already marked as FAILED",
      });
    }

    // If already PAID, cannot fail
    if (payout.status === "PAID") {
      return NextResponse.json(
        { success: false, error: "Cannot fail payout that is already PAID" },
        { status: 409 }
      );
    }

    // Only allow APPROVED or SENT -> FAILED transition (also allow PENDING/READY for backward compatibility)
    const allowedStatuses = ["APPROVED", "SENT", "PENDING", "READY"];
    if (!allowedStatuses.includes(payout.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot fail payout with status ${payout.status}. Only APPROVED, SENT, PENDING, or READY payouts can be failed.`,
        },
        { status: 409 }
      );
    }

    const previousStatus = payout.status;
    const failureNote = note || "Failed by admin";

    await prisma.jobPayout.update({
      where: { id: payoutId },
      data: {
        status: "FAILED",
        executionNote: failureNote,
        updatedAt: new Date(),
      },
    });

    const updated = await prisma.jobPayout.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        jobId: true,
        status: true,
        executionNote: true,
      },
    });

    // Audit logging
    await logAuditEntry({
      actorId: auth.userId,
      actorRole: "ADMIN",
      action: "PAYOUT_FAILED",
      entityType: "JobPayout",
      entityId: payoutId,
      description: `Payout failed for job ${payout.jobId}: ${failureNote}`,
      changes: {
        previousStatus,
        newStatus: "FAILED",
        payoutId,
        jobId: payout.jobId,
        cleanerId: payout.cleanerId,
        executionNote: failureNote,
      },
    });

    console.log(`[FAIL_PAYOUT] Payout ${payoutId} marked FAILED by admin ${auth.userId}: ${failureNote}`);

    // Notify cleaner (non-blocking)
    notifyPayoutFailed(
      payout.cleanerId,
      payoutId,
      payout.cleanerAmount,
      payout.currency,
      failureNote
    ).catch((err) => {
      console.error("[FAIL_PAYOUT] Failed to send notification:", err);
      // Don't fail the request if notification fails
    });

    return NextResponse.json({
      success: true,
      payout: updated,
    });
  } catch (error: any) {
    console.error("[FAIL_PAYOUT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark payout as failed",
      },
      { status: 500 }
    );
  }
}

