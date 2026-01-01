/**
 * Phase 3F: Cleaner Balance Ledger CSV Export
 * 
 * GET /api/admin/reports/ledger
 * 
 * Exports cleaner balance ledger entries as CSV (read-only)
 * 
 * Query params:
 * - cleanerId?: string (filter by cleaner)
 * - type?: CREDIT | DEBIT
 * - status?: PENDING | POSTED | REVERSED
 * - locked?: true | false (filter by payoutTransferId)
 * - dateFrom?: ISO date string
 * - dateTo?: ISO date string
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { generateCsv, formatCsvDate, formatCsvDateTime, formatCsvCurrency } from "@/lib/csv";
import { LedgerEntryType, LedgerEntryStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);
    const cleanerId = searchParams.get("cleanerId");
    const type = searchParams.get("type") as LedgerEntryType | null;
    const status = searchParams.get("status") as LedgerEntryStatus | null;
    const locked = searchParams.get("locked");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build where clause
    const where: any = {};
    if (cleanerId) where.cleanerId = cleanerId;
    if (type && Object.values(LedgerEntryType).includes(type)) {
      where.type = type;
    }
    if (status && Object.values(LedgerEntryStatus).includes(status)) {
      where.status = status;
    }
    if (locked === "true") {
      where.payoutTransferId = { not: null };
    } else if (locked === "false") {
      where.payoutTransferId = null;
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

    // Fetch ledger entries with relations
    const entries = await prisma.cleanerBalanceLedger.findMany({
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
        job: {
          select: {
            id: true,
            customerName: true,
            address: true,
          },
        },
        payoutTransfer: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // CSV Headers
    const headers = [
      "Entry ID",
      "Cleaner ID",
      "Cleaner Name",
      "Cleaner Email",
      "Job ID",
      "Job Customer",
      "Job Address",
      "Type",
      "Status",
      "Amount (USD)",
      "Currency",
      "Description",
      "Payout Transfer ID",
      "Payout Transfer Status",
      "Created At",
    ];

    // CSV Rows
    const rows = entries.map((entry) => [
      entry.id,
      entry.cleanerId,
      entry.cleaner.name || "",
      entry.cleaner.email,
      entry.jobId || "",
      entry.job?.customerName || "",
      entry.job?.address || "",
      entry.type,
      entry.status,
      formatCsvCurrency(entry.amountCents / 100),
      entry.currency,
      entry.description || "",
      entry.payoutTransferId || "",
      entry.payoutTransfer?.status || "",
      formatCsvDateTime(entry.createdAt),
    ]);

    // Generate CSV
    const csvContent = generateCsv(headers, rows);

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `cleaner-balance-ledger-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[LEDGER_EXPORT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export ledger",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


