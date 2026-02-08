/**
 * GET /api/branch-operator/jobs
 *
 * Returns jobs for the operator's branch only (region-scoped).
 * BRANCH_OPERATOR only; no admin/payout/pricing access.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireBranchOperator } from "@/lib/auth/branchOperatorAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireBranchOperator(request);
    if (!auth.branchId) {
      return NextResponse.json(
        { success: false, error: "Branch operator not assigned to a branch" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const cleanerId = searchParams.get("cleanerId");
    const unassignedOnly = searchParams.get("unassignedOnly") === "true";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    const where: Record<string, unknown> = { branchId: auth.branchId };

    if (status && status !== "all") {
      where.status = status;
    }
    if (cleanerId) {
      where.assignedCleanerId = cleanerId;
    } else if (unassignedOnly) {
      where.assignedCleanerId = null;
    }
    if (dateFrom || dateTo) {
      where.preferredDate = {} as Record<string, Date>;
      if (dateFrom) {
        (where.preferredDate as Record<string, Date>).gte = new Date(dateFrom);
        dateFrom.setHours(0, 0, 0, 0);
      }
      if (dateTo) {
        (where.preferredDate as Record<string, Date>).lte = new Date(dateTo);
        dateTo.setHours(23, 59, 59, 999);
      }
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
        { serviceLocation: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            state: true,
          },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            preferSameCleaner: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            primaryBranchId: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ preferredDate: "asc" }, { createdAt: "desc" }],
      take: 200,
    });

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      sessionId: job.sessionId,
      branchId: job.branchId,
      branch: job.Branch,
      customerId: job.customerId,
      customer: job.Customer,
      customerName: job.customerName,
      assignedCleanerId: job.assignedCleanerId,
      assignedCleaner: job.User,
      preferredDate: job.preferredDate?.toISOString() ?? null,
      preferredTime: job.preferredTime,
      serviceType: job.serviceType,
      serviceLocation: job.serviceLocation,
      address: job.address,
      status: job.status,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      currency: job.currency,
      paymentMethod: job.paymentMethod,
      createdAt: job.createdAt.toISOString(),
      assignedAt: job.assignedAt?.toISOString() ?? null,
      onTheWayAt: job.onTheWayAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      jobQualityScore: job.jobQualityScore,
    }));

    return NextResponse.json({ success: true, jobs: formattedJobs });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err) throw err;
    const message = err instanceof Error ? err.message : "Failed to fetch jobs";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
