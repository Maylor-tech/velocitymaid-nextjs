/**
 * GET /api/admin/payouts/export
 * 
 * Admin exports payouts as CSV
 * - Admin auth required
 * - Accepts filters: status, dateFrom, dateTo, cleanerId, branchId
 * - Reuses payout list query logic
 * - Exports CSV with accounting-friendly headers
 * - Includes execution and payment snapshot fields (masked only)
 * - Never exports raw bank data
 * 
 * Query params:
 * - status?: string
 * - dateFrom?: string (ISO date)
 * - dateTo?: string (ISO date)
 * - cleanerId?: string
 * - branchId?: string
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { generateCsv, formatCsvDate, formatCsvDateTime, formatCsvCurrency } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const cleanerId = searchParams.get("cleanerId");
    const branchId = searchParams.get("branchId");

    // Build where clause (reuse list logic)
    const where: any = {};
    if (status) where.status = status;
    if (cleanerId) where.cleanerId = cleanerId;
    if (branchId) where.branchId = branchId;

    // Date filters on createdAt
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Include the entire day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Fetch payouts with all needed fields
    const payouts = await prisma.jobPayout.findMany({
      where,
      select: {
        id: true,
        jobId: true,
        cleanerId: true,
        branchId: true,
        grossAmount: true,
        cleanerAmount: true,
        platformFee: true,
        currency: true,
        status: true,
        paymentMethodSnapshot: true, // Masked snapshot (already safe)
        createdAt: true,
        paidAt: true,
        executedAt: true,
        executionMethod: true,
        externalReferenceId: true,
        executionNote: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      // No limit for export - export all matching records
    });

    // Fetch cleaner and branch info for display
    const cleanerIds = Array.from(new Set(payouts.map((p) => p.cleanerId)));
    const branchIds = Array.from(new Set(payouts.map((p) => p.branchId)));

    const [cleaners, branches] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: cleanerIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      }),
    ]);

    const cleanerMap = new Map(cleaners.map((c) => [c.id, c]));
    const branchMap = new Map(branches.map((b) => [b.id, b]));

    // Prepare CSV data with accounting-friendly headers
    const headers = [
      "Payout ID",
      "Job ID",
      "Cleaner ID",
      "Cleaner Name",
      "Cleaner Email",
      "Branch ID",
      "Branch Name",
      "Status",
      "Gross Amount",
      "Cleaner Amount",
      "Platform Fee",
      "Currency",
      "Payment Method Type",
      "Payment Method Details (Masked)",
      "Created Date",
      "Executed Date",
      "Execution Method",
      "External Reference ID",
      "Execution Note",
      "Paid Date",
    ];

    const rows = payouts.map((p) => {
      const cleaner = cleanerMap.get(p.cleanerId);
      const branch = branchMap.get(p.branchId);
      const snapshot = p.paymentMethodSnapshot as any;

      // Format payment method details (masked only)
      let paymentMethodDetails = "";
      if (snapshot) {
        if (snapshot.methodType === "BANK") {
          paymentMethodDetails = `Bank: ${snapshot.bankName || ""}, Acct: ${snapshot.accountNumber || ""}, Routing: ${snapshot.routingNumber || ""}`;
        } else {
          const handle = snapshot.handle || snapshot.email || snapshot.phone || "";
          paymentMethodDetails = `${snapshot.methodType || ""}: ${handle}`;
        }
      }

      return [
        p.id,
        p.jobId,
        p.cleanerId,
        cleaner?.name || "",
        cleaner?.email || "",
        p.branchId,
        branch?.name || "",
        p.status,
        formatCsvCurrency(p.grossAmount),
        formatCsvCurrency(p.cleanerAmount),
        formatCsvCurrency(p.platformFee),
        p.currency,
        snapshot?.methodType || "",
        paymentMethodDetails,
        formatCsvDate(p.createdAt),
        formatCsvDateTime(p.executedAt),
        p.executionMethod || "",
        p.externalReferenceId || "",
        p.executionNote || "",
        formatCsvDateTime(p.paidAt),
      ];
    });

    // Generate CSV content
    const csvContent = generateCsv(headers, rows);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payouts-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[PAYOUTS_EXPORT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to export payouts",
      },
      { status: 500 }
    );
  }
}






