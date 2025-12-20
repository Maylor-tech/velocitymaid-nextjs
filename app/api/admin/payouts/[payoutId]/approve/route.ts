/**
 * POST /api/admin/payouts/[payoutId]/approve
 * 
 * Admin approves a PENDING payout
 * - Sets status to APPROVED
 * - Stores approval timestamp in adminDecision (policyEvalDetails)
 * - Ensures TransactionLedger entry exists
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const payoutId = params.payoutId;
    const approvalTimestamp = new Date();

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
          error: `Cannot approve payout with status ${payout.status}. Only PENDING payouts can be approved.`,
        },
        { status: 400 }
      );
    }

    const previousStatus = payout.status;
    const existingDetails = (payout.policyEvalDetails as any) || {};
    const updatedDetails = {
      ...existingDetails,
      adminDecision: {
        action: "APPROVED",
        timestamp: approvalTimestamp.toISOString(),
        adminId: auth.userId,
      },
    };

    await prisma.$transaction(async (tx) => {
      // Update payout status and adminDecision
      await tx.jobPayout.update({
        where: { id: payoutId },
        data: {
          status: "APPROVED",
          policyEvalDetails: updatedDetails,
        },
      });

      // Check if TransactionLedger entry exists
      const existingLedger = await tx.transactionLedger.findFirst({
        where: {
          referenceId: payoutId,
          referenceType: "JobPayout",
        },
      });

      // Create ledger entry if missing (idempotent)
      if (!existingLedger) {
        await tx.transactionLedger.create({
          data: {
            id: randomUUID(),
            branchId: payout.branchId,
            transactionType: "CLEANER_PAYOUT",
            amount: payout.cleanerAmount,
            currency: payout.currency,
            description: `Approved payout for job ${payout.jobId}`,
            referenceId: payoutId,
            referenceType: "JobPayout",
            cleanerId: payout.cleanerId,
            metadata: {
              jobId: payout.jobId,
              payoutId: payoutId,
              approvedAt: approvalTimestamp.toISOString(),
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
        policyEvalDetails: true,
      },
    });

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: "ADMIN",
      action: "PAYOUT_APPROVED",
      entityType: "JobPayout",
      entityId: payoutId,
      description: `Payout approved for job ${payout.jobId}`,
      changes: {
        previousStatus,
        newStatus: "APPROVED",
        payoutId,
        jobId: payout.jobId,
        cleanerId: payout.cleanerId,
        amount: payout.cleanerAmount,
        currency: payout.currency,
        timestamp: approvalTimestamp.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      payout: updated,
    });
  } catch (error: any) {
    console.error("[APPROVE_PAYOUT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to approve payout",
      },
      { status: 500 }
    );
  }
}

