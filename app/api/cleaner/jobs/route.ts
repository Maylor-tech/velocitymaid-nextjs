import { NextRequest, NextResponse } from "next/server";
import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { requireRole } from "@/lib/auth/requireRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LISTABLE_STATUSES: JobStatus[] = [
  JobStatus.ASSIGNED,
  JobStatus.ON_THE_WAY,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
];

/**
 * GET /api/cleaner/jobs?status=ASSIGNED
 *
 * Returns jobs assigned to the authenticated cleaner.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "CLEANER");
    const cleanerId = auth.userId;

    const statusParam = req.nextUrl.searchParams.get("status")?.toUpperCase();
    const statusFilter =
      statusParam && Object.values(JobStatus).includes(statusParam as JobStatus)
        ? (statusParam as JobStatus)
        : null;

    const jobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        status: statusFilter
          ? statusFilter
          : { in: LISTABLE_STATUSES },
      },
      orderBy: [{ preferredDate: "asc" }, { assignedAt: "desc" }],
      select: {
        id: true,
        status: true,
        customerName: true,
        serviceType: true,
        serviceLocation: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        currency: true,
        assignedAt: true,
        startedAt: true,
        completedAt: true,
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const formattedJobs = jobs.map((job) => ({
      ...job,
      preferredDate: job.preferredDate?.toISOString() ?? null,
      assignedAt: job.assignedAt?.toISOString() ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[CLEANER_JOBS_LIST]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch jobs",
      },
      { status: 500 }
    );
  }
}
