import { NextRequest, NextResponse } from "next/server";
import { JobOfferStatus, JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { toCleanerCompensationView } from "@/lib/dispatch/compensation";
import { assertNoCustomerFinancials } from "@/lib/dispatch/cleanerFinancialGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LISTABLE_STATUSES: JobStatus[] = [
  JobStatus.ASSIGNED,
  JobStatus.ON_THE_WAY,
  JobStatus.IN_PROGRESS,
  JobStatus.AWAITING_QC,
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
        submittedForQcAt: true,
        estimatedDurationMins: true,
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
        JobOffer: {
          where: {
            cleanerId,
            status: JobOfferStatus.ACCEPTED,
          },
          take: 1,
          select: {
            compensationAmount: true,
            compensationCurrency: true,
            compensationBasis: true,
          },
        },
      },
    });

    const formattedJobs = jobs.map((job) => {
      const accepted = job.JobOffer[0] ?? null;
      const compensation = accepted
        ? toCleanerCompensationView({
            amount: accepted.compensationAmount,
            currency: accepted.compensationCurrency,
            basis: accepted.compensationBasis,
          })
        : null;
      const { JobOffer: _offers, ...rest } = job;
      return {
        ...rest,
        preferredDate: job.preferredDate?.toISOString() ?? null,
        assignedAt: job.assignedAt?.toISOString() ?? null,
        startedAt: job.startedAt?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
        submittedForQcAt: job.submittedForQcAt?.toISOString() ?? null,
        compensation,
        compensationAmount: compensation?.amount ?? null,
        compensationCurrency: compensation?.currency ?? null,
        compensationBasis: compensation?.basis ?? null,
      };
    });

    const body = {
      success: true,
      jobs: formattedJobs,
    };
    assertNoCustomerFinancials(body, "cleaner jobs list");
    return NextResponse.json(body);
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
