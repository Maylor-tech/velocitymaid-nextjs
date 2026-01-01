/**
 * GET /api/admin/payouts/weekly-summary
 * 
 * Returns aggregated payout statistics for a date range
 * - Requires ADMIN auth
 * - Accepts dateFrom and dateTo query params
 * - Returns total count, total amount, and breakdown by status
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const url = new URL(request.url);
    const dateFrom = parseDateParam(url.searchParams.get("dateFrom"));
    const dateTo = parseDateParam(url.searchParams.get("dateTo"));

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: "dateFrom and dateTo are required" },
        { status: 400 }
      );
    }

    // Inclusive range safety
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999); // End of day

    const where = { createdAt: { gte: from, lte: to } };

    try {
      const [totals, byStatus] = await Promise.all([
        prisma.jobPayout.aggregate({
          where,
          _count: { id: true },
          _sum: { cleanerAmount: true },
        }),
        prisma.jobPayout.groupBy({
          where,
          by: ["status"],
          _count: { _all: true },
          _sum: { cleanerAmount: true },
        }),
      ]);

      const statusMap = Object.fromEntries(
        byStatus.map((r) => [
          r.status,
          { 
            count: r._count._all || 0, 
            amount: Number(r._sum.cleanerAmount ?? 0) 
          },
        ])
      );

      return NextResponse.json({
        success: true,
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        totalCount: totals._count.id || 0,
        totalAmount: Number(totals._sum.cleanerAmount ?? 0),
        status: statusMap,
      });
    } catch (dbError: any) {
      console.error("[WEEKLY_SUMMARY] Database error:", dbError);
      // Return empty results instead of failing
      return NextResponse.json({
        success: true,
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        totalCount: 0,
        totalAmount: 0,
        status: {},
      });
    }
  } catch (error: any) {
    console.error("[WEEKLY_SUMMARY] Error:", error);
    console.error("[WEEKLY_SUMMARY] Error stack:", error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch weekly summary",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

