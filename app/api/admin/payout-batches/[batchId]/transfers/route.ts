/**
 * Phase 3B: Payout Batch Transfers API
 * 
 * GET /api/admin/payout-batches/[batchId]/transfers
 * 
 * Lists transfers for a batch with paging and optional status filter
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus } from "@prisma/client";

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

    // Verify batch exists
    const batch = await prisma.payoutBatch.findUnique({
      where: { id: batchId },
      select: { id: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status") as PayoutTransferStatus | null;

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { success: false, error: "page must be >= 1" },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(PayoutTransferStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(PayoutTransferStatus).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      batchId,
    };
    if (status) {
      where.status = status;
    }

    // Get transfers with cleaner info and locked ledger entry counts
    const [transfers, total] = await Promise.all([
      prisma.payoutTransfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "asc",
        },
        include: {
          cleaner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              ledgerEntries: true,
            },
          },
        },
      }),
      prisma.payoutTransfer.count({ where }),
    ]);

    // Calculate locked ledger amounts for each transfer
    const transfersWithDetails = await Promise.all(
      transfers.map(async (transfer) => {
        const ledgerSum = await prisma.cleanerBalanceLedger.aggregate({
          where: {
            payoutTransferId: transfer.id,
          },
          _sum: {
            amountCents: true,
          },
          _count: {
            id: true,
          },
        });

        return {
          id: transfer.id,
          cleanerId: transfer.cleanerId,
          cleaner: transfer.cleaner,
          amountCents: transfer.amountCents,
          amountDollars: (transfer.amountCents / 100).toFixed(2),
          currency: transfer.currency,
          status: transfer.status,
          stripePayoutId: transfer.stripePayoutId,
          failureReason: transfer.failureReason,
          lockedEntriesCount: transfer._count.ledgerEntries,
          lockedAmountCents: ledgerSum._sum.amountCents || 0,
          lockedAmountDollars: ((ledgerSum._sum.amountCents || 0) / 100).toFixed(2),
          createdAt: transfer.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      batchId,
      transfers: transfersWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        status: status || null,
      },
    });
  } catch (error: any) {
    console.error("[LIST_BATCH_TRANSFERS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to list batch transfers",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

