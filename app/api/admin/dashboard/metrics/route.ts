/**
 * Admin Dashboard Metrics API
 * 
 * GET /api/admin/dashboard/metrics
 * 
 * Returns authoritative counts by status
 * Derived from ContactMessage.status (single source of truth)
 * Admin-only, protected by requireRole("ADMIN")
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireRole(request, "ADMIN");

    // Single query: group by status and count
    const grouped = await prisma.contactMessage.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // Initialize metrics with zero counts
    const metrics = {
      NEW: 0,
      REVIEWED: 0,
      REPLIED: 0,
      ARCHIVED: 0,
    };

    // Map grouped results to metrics object
    for (const row of grouped) {
      if (row.status in metrics) {
        metrics[row.status as keyof typeof metrics] = row._count.status;
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error("[ADMIN_DASHBOARD_METRICS] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch dashboard metrics",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

