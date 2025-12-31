/**
 * Phase 3B: Payout Batch Admin API
 * 
 * POST /api/admin/payout-batches - Create DRAFT payout batch
 * GET /api/admin/payout-batches - List batches with paging and status filter
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { createPayoutBatchDraft } from "@/lib/payout/batchCreationService";
import { prisma } from "@/lib/prisma";
import { PayoutBatchStatus } from "@prisma/client";

/**
 * POST /api/admin/payout-batches
 * 
 * Creates a DRAFT payout batch using createPayoutBatchDraft
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { periodStart, periodEnd } = body;

    // Validate date range
    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        {
          success: false,
          error: "periodStart and periodEnd are required (ISO date strings)",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use ISO date strings.",
        },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "periodStart must be before periodEnd",
        },
        { status: 400 }
      );
    }

    // Create batch draft (snapshots eligibility, creates transfers, locks ledger)
    const result = await createPayoutBatchDraft(
      startDate,
      endDate,
      auth.userId
    );

    return NextResponse.json({
      success: true,
      batch: {
        id: result.batchId,
        periodStart: result.periodStart.toISOString(),
        periodEnd: result.periodEnd.toISOString(),
        totalAmountCents: result.totalAmountCents,
        totalAmountDollars: (result.totalAmountCents / 100).toFixed(2),
      },
      summary: {
        totalCleaners: result.totalCleaners,
        eligibleCleaners: result.eligibleCleaners,
        skippedCleaners: result.skippedCleaners,
      },
      transfers: result.transfers.map((t) => ({
        transferId: t.transferId,
        cleanerId: t.cleanerId,
        amountCents: t.amountCents,
        amountDollars: (t.amountCents / 100).toFixed(2),
        lockedEntriesCount: t.lockedEntriesCount,
      })),
      skipped: result.skipped,
      message: `Created payout batch draft with ${result.eligibleCleaners} eligible cleaner(s), total: $${(result.totalAmountCents / 100).toFixed(2)}`,
    });
  } catch (error: any) {
    console.error("[CREATE_PAYOUT_BATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create payout batch",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payout-batches
 * 
 * Lists batches with paging and optional status filter
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") as PayoutBatchStatus | null;

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
    if (status && !Object.values(PayoutBatchStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(PayoutBatchStatus).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get batches with transfer counts
    const [batches, total] = await Promise.all([
      prisma.payoutBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              transfers: true,
            },
          },
        },
      }),
      prisma.payoutBatch.count({ where }),
    ]);

    // Calculate aggregate totals for each batch
    const batchesWithTotals = await Promise.all(
      batches.map(async (batch) => {
        const transferStats = await prisma.payoutTransfer.aggregate({
          where: { batchId: batch.id },
          _sum: {
            amountCents: true,
          },
          _count: {
            id: true,
          },
        });

        return {
          id: batch.id,
          periodStart: batch.periodStart.toISOString(),
          periodEnd: batch.periodEnd.toISOString(),
          status: batch.status,
          totalAmountCents: batch.totalAmountCents || transferStats._sum.amountCents || 0,
          totalAmountDollars: (
            (batch.totalAmountCents || transferStats._sum.amountCents || 0) /
            100
          ).toFixed(2),
          transferCount: batch._count.transfers,
          createdByAdminId: batch.createdByAdminId,
          createdAt: batch.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      batches: batchesWithTotals,
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
    console.error("[LIST_PAYOUT_BATCHES] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to list payout batches",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

