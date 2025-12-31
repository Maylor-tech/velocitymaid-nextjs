/**
 * Phase 3F: Payout Batches CSV Export
 * 
 * GET /api/admin/reports/payout-batches
 * 
 * Exports payout batches as CSV (read-only)
 * 
 * Query params:
 * - status?: DRAFT | APPROVED | PROCESSING | COMPLETED | FAILED
 * - dateFrom?: ISO date string
 * - dateTo?: ISO date string
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { generateCsv, formatCsvDate, formatCsvDateTime, formatCsvCurrency } from "@/lib/csv";
import { PayoutBatchStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PayoutBatchStatus | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build where clause
    const where: any = {};
    if (status && Object.values(PayoutBatchStatus).includes(status)) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Fetch batches with transfer counts
    const batches = await prisma.payoutBatch.findMany({
      where,
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
    });

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
          ...batch,
          totalAmountCents: batch.totalAmountCents || transferStats._sum.amountCents || 0,
          transferCount: batch._count.transfers,
        };
      })
    );

    // CSV Headers
    const headers = [
      "Batch ID",
      "Period Start",
      "Period End",
      "Status",
      "Total Amount (USD)",
      "Transfer Count",
      "Created By Admin ID",
      "Created At",
    ];

    // CSV Rows
    const rows = batchesWithTotals.map((batch) => [
      batch.id,
      formatCsvDate(batch.periodStart),
      formatCsvDate(batch.periodEnd),
      batch.status,
      formatCsvCurrency(batch.totalAmountCents / 100),
      batch.transferCount.toString(),
      batch.createdByAdminId || "",
      formatCsvDateTime(batch.createdAt),
    ]);

    // Generate CSV
    const csvContent = generateCsv(headers, rows);

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `payout-batches-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[PAYOUT_BATCHES_EXPORT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export payout batches",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


