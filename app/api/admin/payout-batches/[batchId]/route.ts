/**
 * Phase 3B: Payout Batch Details API
 * 
 * GET /api/admin/payout-batches/[batchId] - Returns batch summary + aggregate totals
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const { batchId } = params;

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: "batchId is required" },
        { status: 400 }
      );
    }

    // Get batch with basic info
    const batch = await prisma.payoutBatch.findUnique({
      where: { id: batchId },
      include: {
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

    // Get aggregate totals from transfers
    const transferStats = await prisma.payoutTransfer.aggregate({
      where: { batchId },
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    });

    // Get status breakdown
    const statusBreakdown = await prisma.payoutTransfer.groupBy({
      by: ["status"],
      where: { batchId },
      _count: {
        id: true,
      },
      _sum: {
        amountCents: true,
      },
    });

    // Get cleaner count
    const uniqueCleaners = await prisma.payoutTransfer.findMany({
      where: { batchId },
      select: {
        cleanerId: true,
      },
      distinct: ["cleanerId"],
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        periodStart: batch.periodStart.toISOString(),
        periodEnd: batch.periodEnd.toISOString(),
        status: batch.status,
        totalAmountCents: batch.totalAmountCents || transferStats._sum.amountCents || 0,
        totalAmountDollars: (
          (batch.totalAmountCents || transferStats._sum.amountCents || 0) / 100
        ).toFixed(2),
        createdByAdminId: batch.createdByAdminId,
        createdAt: batch.createdAt.toISOString(),
      },
      aggregates: {
        totalTransfers: transferStats._count.id,
        totalAmountCents: transferStats._sum.amountCents || 0,
        totalAmountDollars: ((transferStats._sum.amountCents || 0) / 100).toFixed(2),
        uniqueCleaners: uniqueCleaners.length,
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s.status,
          count: s._count.id,
          amountCents: s._sum.amountCents || 0,
          amountDollars: ((s._sum.amountCents || 0) / 100).toFixed(2),
        })),
      },
    });
  } catch (error: any) {
    console.error("[GET_PAYOUT_BATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get batch details",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

