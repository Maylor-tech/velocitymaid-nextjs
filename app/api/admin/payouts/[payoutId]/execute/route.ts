/**
 * POST /api/admin/payouts/[payoutId]/execute
 * 
 * Admin executes (sends) an APPROVED payout
 * - Only allows APPROVED -> SENT transition
 * - Sets executedAt = now()
 * - Stores executionMethod, externalReferenceId, executionNote
 * - Ensures idempotency: if already SENT, return 200; if PAID, return 409
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { notifyPayoutSent } from "@/lib/notifications";
import { DEMO_MODE } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const payoutId = params.payoutId;

    const body = await request.json().catch(() => ({}));
    const { executionMethod, externalReferenceId, note } = body;

    // Validate required fields
    if (!executionMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required field: executionMethod" },
        { status: 400 }
      );
    }

    const validMethodTypes = ["MANUAL", "ZELLE", "VENMO", "CASH", "BANK", "CASH_APP", "PAYPAL"];
    if (!validMethodTypes.includes(executionMethod)) {
      return NextResponse.json(
        { success: false, error: `Invalid executionMethod. Must be one of: ${validMethodTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate string lengths
    if (externalReferenceId && externalReferenceId.length > 120) {
      return NextResponse.json(
        { success: false, error: "externalReferenceId must be 120 characters or less" },
        { status: 400 }
      );
    }

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
        executedAt: true,
        executionMethod: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    // Idempotency: if already SENT, return 200 with existing record
    if (payout.status === "SENT") {
      return NextResponse.json({
        success: true,
        payout: {
          id: payout.id,
          status: payout.status,
          executedAt: payout.executedAt,
          executionMethod: payout.executionMethod,
        },
        message: "Payout is already in SENT status",
      });
    }

    // If already PAID, return 409
    if (payout.status === "PAID") {
      return NextResponse.json(
        { success: false, error: "Cannot execute payout that is already PAID" },
        { status: 409 }
      );
    }

    // Only allow APPROVED -> SENT transition (also allow PENDING/READY for backward compatibility)
    const allowedStatuses = ["APPROVED", "PENDING", "READY"];
    if (!allowedStatuses.includes(payout.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot execute payout with status ${payout.status}. Only APPROVED, PENDING, or READY payouts can be executed.`,
        },
        { status: 409 }
      );
    }

    const previousStatus = payout.status;
    const executedAt = new Date();

    // DEMO MODE: Update database but mark as demo (no real payment rails)
    if (DEMO_MODE) {
      console.log(`[DEMO_MODE] Executing payout ${payoutId} (demo mode - no real payment)`);
      
      await prisma.jobPayout.update({
        where: { id: payoutId },
        data: {
          status: "SENT",
          executedAt,
          executionMethod,
          externalReferenceId: externalReferenceId || null,
          executionNote: (note || "") + " [DEMO MODE]",
          updatedAt: new Date(),
        },
      });

      const updated = await prisma.jobPayout.findUnique({
        where: { id: payoutId },
        select: {
          id: true,
          jobId: true,
          status: true,
          executedAt: true,
          executionMethod: true,
          externalReferenceId: true,
          executionNote: true,
        },
      });

      // Don't send real notifications in demo mode
      console.log(`[DEMO_MODE] Payout ${payoutId} executed (demo - notification skipped)`);

      return NextResponse.json({
        success: true,
        payout: updated,
        demoMode: true,
        message: "[DEMO MODE] Payout executed. No real payment processed.",
      });
    }

    // PRODUCTION: Real database update + real notifications
    await prisma.jobPayout.update({
      where: { id: payoutId },
      data: {
        status: "SENT",
        executedAt,
        executionMethod,
        externalReferenceId: externalReferenceId || null,
        executionNote: note || null,
        updatedAt: new Date(),
      },
    });

    const updated = await prisma.jobPayout.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        jobId: true,
        status: true,
        executedAt: true,
        executionMethod: true,
        externalReferenceId: true,
        executionNote: true,
      },
    });

    // Audit logging
    await logAuditEntry({
      actorId: auth.userId,
      actorRole: "ADMIN",
      action: "PAYOUT_EXECUTED",
      entityType: "JobPayout",
      entityId: payoutId,
      description: `Payout executed for job ${payout.jobId} via ${executionMethod}`,
      changes: {
        previousStatus,
        newStatus: "SENT",
        payoutId,
        jobId: payout.jobId,
        cleanerId: payout.cleanerId,
        executionMethod,
        externalReferenceId: externalReferenceId || null,
        executionNote: note || null,
        executedAt: executedAt.toISOString(),
      },
    });

    console.log(`[EXECUTE_PAYOUT] Payout ${payoutId} executed via ${executionMethod} by admin ${auth.userId}`);

    // Notify cleaner (non-blocking)
    notifyPayoutSent(
      payout.cleanerId,
      payoutId,
      payout.cleanerAmount,
      payout.currency,
      executionMethod
    ).catch((err) => {
      console.error("[EXECUTE_PAYOUT] Failed to send notification:", err);
      // Don't fail the request if notification fails
    });

    return NextResponse.json({
      success: true,
      payout: updated,
    });
  } catch (error: any) {
    console.error("[EXECUTE_PAYOUT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute payout",
      },
      { status: 500 }
    );
  }
}

