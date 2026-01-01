/**
 * Phase 3G: Cleaner Payout Statements (CSV)
 * 
 * GET /api/cleaner/statements
 * 
 * Exports cleaner's payout history as CSV (read-only)
 * 
 * Query params:
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
    // Authenticate cleaner and get cleanerId
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PayoutTransferStatus | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build where clause (scoped to this cleaner)
    const where: any = {
      cleanerId, // CRITICAL: Only this cleaner's transfers
    };

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

    // Fetch transfers with batch info
    const transfers = await prisma.payoutTransfer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        batch: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            status: true,
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
    const filename = `payout-statements-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[CLEANER_STATEMENTS_CSV] Error:", error);
    
    // Handle auth errors
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export payout statements",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


