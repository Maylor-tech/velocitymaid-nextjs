/**
 * Admin Command Center Stats API
 *
 * GET /api/admin/dashboard/command-center
 *
 * Returns live operational stats for the /admin dashboard:
 *  - Per-market stats (Vermont, New Jersey): active clients, completed this
 *    month, revenue this month.
 *  - Job pipeline counts: scheduled, in progress, completed (all time),
 *    archived (soft-deleted).
 *
 * Reads from the Postgres jobs table via Prisma (same DB as Supabase).
 * Admin-only, protected by requireRole("ADMIN").
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

const SCHEDULED_STATUSES: JobStatus[] = [
  JobStatus.RECEIVED,
  JobStatus.CONFIRMED,
  JobStatus.ASSIGNED,
];
const IN_PROGRESS_STATUSES: JobStatus[] = [
  JobStatus.ON_THE_WAY,
  JobStatus.IN_PROGRESS,
];
const CANCELLED_STATUSES: JobStatus[] = [
  JobStatus.CANCELLED,
  JobStatus.CANCELLED_EMERGENCY,
];

interface MarketStat {
  activeClients: number;
  completedThisMonth: number;
  revenueThisMonth: number;
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

async function getMarketStat(slug: string): Promise<MarketStat> {
  const empty: MarketStat = {
    activeClients: 0,
    completedThisMonth: 0,
    revenueThisMonth: 0,
  };

  const branch = await prisma.branch.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!branch) return empty;

  const branchId = branch.id;
  const { start, end } = currentMonthRange();

  // Active clients: distinct customers with at least one live (non-cancelled,
  // non-archived) job in this market. The schema has no Customer.status flag,
  // so "active" is derived from operational job activity.
  const activeClientRows = await prisma.job.findMany({
    where: {
      branchId,
      archivedAt: null,
      customerId: { not: null },
      status: { notIn: CANCELLED_STATUSES },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  const completedThisMonth = await prisma.job.count({
    where: {
      branchId,
      status: JobStatus.COMPLETED,
      completedAt: { gte: start, lt: end },
    },
  });

  const revenueAgg = await prisma.job.aggregate({
    _sum: { amountPaid: true },
    where: {
      branchId,
      completedAt: { gte: start, lt: end },
    },
  });

  return {
    activeClients: activeClientRows.length,
    completedThisMonth,
    revenueThisMonth: Number(revenueAgg._sum.amountPaid ?? 0),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const [vermont, newJersey, scheduled, inProgress, completed, archived] =
      await Promise.all([
        getMarketStat("vermont"),
        getMarketStat("new-jersey"),
        prisma.job.count({
          where: { archivedAt: null, status: { in: SCHEDULED_STATUSES } },
        }),
        prisma.job.count({
          where: { archivedAt: null, status: { in: IN_PROGRESS_STATUSES } },
        }),
        prisma.job.count({
          where: { archivedAt: null, status: JobStatus.COMPLETED },
        }),
        prisma.job.count({
          where: { archivedAt: { not: null } },
        }),
      ]);

    return NextResponse.json({
      success: true,
      markets: {
        vermont,
        "new-jersey": newJersey,
      },
      pipeline: {
        scheduled,
        inProgress,
        completed,
        archived,
      },
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error("[ADMIN_COMMAND_CENTER] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch command center stats",
      },
      { status: 500 }
    );
  }
}
