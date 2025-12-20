/**
 * PATCH /api/admin/payouts/[payoutId]/mark-paid
 * 
 * Admin marks an APPROVED payout as PAID
 * - Only allows APPROVED -> PAID transition
 * - Stores payment settlement metadata
 * - Ensures TransactionLedger entry exists
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const payoutId = params.payoutId;

    const body = await request.json().catch(() => ({}));
    const { paidMethodType, paidMethodLabel, reference, paidAt } = body;

    // Validate required fields
    if (!paidMethodType) {
      return NextResponse.json(
        { success: false, error: "Missing required field: paidMethodType" },
        { status: 400 }
      );
    }

    const validMethodTypes = ["CASH", "ZELLE", "VENMO", "BANK"];
    if (!validMethodTypes.includes(paidMethodType)) {
      return NextResponse.json(
        { success: false, error: `Invalid paidMethodType. Must be one of: ${validMethodTypes.join(", ")}` },
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
        paidAt: true,
        policyEvalDetails: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    // Check if already PAID (idempotency)
    if (payout.status === "PAID") {
      return NextResponse.json(
        { success: false, error: "Payout is already marked as PAID" },
        { status: 409 }
      );
    }

    // Only allow APPROVED -> PAID transition
    if (payout.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot mark payout as PAID. Current status is ${payout.status}. Only APPROVED payouts can be marked as PAID.`,
        },
        { status: 400 }
      );
    }

    const previousStatus = payout.status;
    const settlementTimestamp = paidAt ? new Date(paidAt) : new Date();
    const existingDetails = (payout.policyEvalDetails as any) || {};

    // Store settlement metadata
    const updatedDetails = {
      ...existingDetails,
      paymentSettlement: {
        methodType: paidMethodType,
        label: paidMethodLabel || null,
        reference: reference || null,
        timestamp: settlementTimestamp.toISOString(),
        adminId: auth.userId,
      },
    };

    await prisma.$transaction(async (tx) => {
      // Update payout status and settlement metadata
      await tx.jobPayout.update({
        where: { id: payoutId },
        data: {
          status: "PAID",
          paidAt: settlementTimestamp,
          policyEvalDetails: updatedDetails,
        },
      });

      // Ensure TransactionLedger entry exists (idempotent check)
      const existingLedger = await tx.transactionLedger.findFirst({
        where: {
          referenceId: payoutId,
          referenceType: "JobPayout",
        },
      });

      if (!existingLedger) {
        await tx.transactionLedger.create({
          data: {
            id: randomUUID(),
            branchId: payout.branchId,
            transactionType: "CLEANER_PAYOUT",
            amount: payout.cleanerAmount,
            currency: payout.currency,
            description: `Payout marked PAID for job ${payout.jobId}`,
            referenceId: payoutId,
            referenceType: "JobPayout",
            cleanerId: payout.cleanerId,
            metadata: {
              jobId: payout.jobId,
              payoutId: payoutId,
              paidAt: settlementTimestamp.toISOString(),
              methodType: paidMethodType,
            },
          },
        });
      }
    });

    const updated = await prisma.jobPayout.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        jobId: true,
        status: true,
        paidAt: true,
        policyEvalDetails: true,
      },
    });

    // Audit logging
    await logAuditEntry({
      actorId: auth.userId,
      actorRole: "ADMIN",
      action: "PAYOUT_MARK_PAID",
      entityType: "JobPayout",
      entityId: payoutId,
      description: `Payout marked PAID for job ${payout.jobId} via ${paidMethodType}`,
      changes: {
        previousStatus,
        newStatus: "PAID",
        payoutId,
        jobId: payout.jobId,
        cleanerId: payout.cleanerId,
        timestamp: settlementTimestamp.toISOString(),
        methodType: paidMethodType,
        reference: reference || null,
      },
    });

    console.log(`[MARK_PAID] Payout ${payoutId} marked PAID via ${paidMethodType} by admin ${auth.userId}`);

    return NextResponse.json({
      success: true,
      payout: updated,
    });
  } catch (error: any) {
    console.error("[MARK_PAID] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark payout as paid",
      },
      { status: 500 }
    );
  }
}
