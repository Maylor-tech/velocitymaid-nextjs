/**
 * GET /api/branch-operator/jobs/[jobId]
 *
 * Returns one job for the operator's branch only. 404 if job not in branch.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireBranchOperator } from "@/lib/auth/branchOperatorAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const auth = await requireBranchOperator(request);
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, branchId: auth.branchId! },
      select: {
        id: true,
        sessionId: true,
        branchId: true,
        customerId: true,
        customerName: true,
        assignedCleanerId: true,
        preferredDate: true,
        preferredTime: true,
        serviceType: true,
        serviceLocation: true,
        address: true,
        status: true,
        totalPrice: true,
        currency: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        assignedAt: true,
        onTheWayAt: true,
        completedAt: true,
        jobQualityScore: true,
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            state: true,
            city: true,
          },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        ...job,
        preferredDate: job.preferredDate?.toISOString() ?? null,
        assignedAt: job.assignedAt?.toISOString() ?? null,
        onTheWayAt: job.onTheWayAt?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
        totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      },
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err) throw err;
    const message = err instanceof Error ? err.message : "Failed to fetch job";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
