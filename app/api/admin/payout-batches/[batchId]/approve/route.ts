/**
 * Phase 3B: Approve Payout Batch API
 * 
 * POST /api/admin/payout-batches/[batchId]/approve
 * 
 * Transitions DRAFT → APPROVED (no Stripe calls)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutBatchStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const { batchId } = params;

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: "batchId is required" },
        { status: 400 }
      );
    }

    // Get batch and verify it's in DRAFT status
    const batch = await prisma.payoutBatch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        status: true,
        totalAmountCents: true,
        _count: {
          select: {
            transfers: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    if (batch.status !== PayoutBatchStatus.DRAFT) {
      return NextResponse.json(
        {
          success: false,
          error: `Batch is not in DRAFT status. Current status: ${batch.status}`,
        },
        { status: 400 }
      );
    }

    // Update batch status to APPROVED
    const updatedBatch = await prisma.payoutBatch.update({
      where: { id: batchId },
      data: {
        status: PayoutBatchStatus.APPROVED,
      },
      include: {
        _count: {
          select: {
            transfers: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: updatedBatch.id,
        status: updatedBatch.status,
        totalAmountCents: updatedBatch.totalAmountCents,
        totalAmountDollars: updatedBatch.totalAmountCents
          ? (updatedBatch.totalAmountCents / 100).toFixed(2)
          : "0.00",
        transferCount: updatedBatch._count.transfers,
      },
      message: "Batch approved successfully. Ready for Stripe processing.",
    });
  } catch (error: any) {
    console.error("[APPROVE_PAYOUT_BATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to approve batch",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

