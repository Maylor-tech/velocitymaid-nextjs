/**
 * Phase 3F: Payout Transfers CSV Export
 * 
 * GET /api/admin/reports/payout-transfers
 * 
 * Exports payout transfers as CSV (read-only)
 * 
 * Query params:
 * - batchId?: string (filter by batch)
 * - cleanerId?: string (filter by cleaner)
 * - status?: PENDING | PROCESSING | PAID | FAILED
 * - dateFrom?: ISO date string
 * - dateTo?: ISO date string
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { generateCsv, formatCsvDate, formatCsvDateTime, formatCsvCurrency } from "@/lib/csv";
import { PayoutTransferStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const cleanerId = searchParams.get("cleanerId");
    const status = searchParams.get("status") as PayoutTransferStatus | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build where clause
    const where: any = {};
    if (batchId) where.batchId = batchId;
    if (cleanerId) where.cleanerId = cleanerId;
    if (status && Object.values(PayoutTransferStatus).includes(status)) {
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

    // Fetch transfers with cleaner info and locked ledger counts
    const transfers = await prisma.payoutTransfer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        batch: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        _count: {
          select: {
            ledgerEntries: true,
          },
        },
      },
    });

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
          ...transfer,
          lockedAmountCents: ledgerSum._sum.amountCents || 0,
          lockedEntriesCount: transfer._count.ledgerEntries,
        };
      })
    );

    // CSV Headers
    const headers = [
      "Transfer ID",
      "Batch ID",
      "Period Start",
      "Period End",
      "Cleaner ID",
      "Cleaner Name",
      "Cleaner Email",
      "Amount (USD)",
      "Currency",
      "Status",
      "Stripe Payout ID",
      "Failure Reason",
      "Locked Entries Count",
      "Locked Amount (USD)",
      "Created At",
    ];

    // CSV Rows
    const rows = transfersWithDetails.map((transfer) => [
      transfer.id,
      transfer.batchId,
      formatCsvDate(transfer.batch.periodStart),
      formatCsvDate(transfer.batch.periodEnd),
      transfer.cleanerId,
      transfer.cleaner.name || "",
      transfer.cleaner.email,
      formatCsvCurrency(transfer.amountCents / 100),
      transfer.currency,
      transfer.status,
      transfer.stripePayoutId || "",
      transfer.failureReason || "",
      transfer.lockedEntriesCount.toString(),
      formatCsvCurrency(transfer.lockedAmountCents / 100),
      formatCsvDateTime(transfer.createdAt),
    ]);

    // Generate CSV
    const csvContent = generateCsv(headers, rows);

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `payout-transfers-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[PAYOUT_TRANSFERS_EXPORT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export payout transfers",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


