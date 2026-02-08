/**
 * POST /api/branch-operator/jobs/[jobId]/assign
 *
 * Assigns a cleaner to a job. Job must belong to operator's branch.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireBranchOperator } from "@/lib/auth/branchOperatorAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const auth = await requireBranchOperator(request);
    const { jobId } = await params;
    const body = await request.json();
    const { cleanerId } = body as { cleanerId?: string };

    if (!jobId || !cleanerId) {
      return NextResponse.json(
        { success: false, error: "jobId and cleanerId are required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, branchId: auth.branchId! },
      include: {
        Branch: { select: { id: true, name: true, slug: true } },
        Customer: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const cleaner = await prisma.user.findFirst({
      where: {
        id: cleanerId,
        role: "CLEANER",
        OR: [
          { primaryBranchId: auth.branchId! },
          { UserBranch: { some: { branchId: auth.branchId! } } },
        ],
      },
      select: { id: true, name: true, email: true },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: "Cleaner not found or not in this branch" },
        { status: 404 }
      );
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: cleanerId,
        status:
          job.status === "RECEIVED" || job.status === "CONFIRMED" || job.status === "pending" || job.status === "assigned"
            ? "assigned"
            : job.status,
        assignedAt: new Date(),
      },
      include: {
        User: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await prisma.assignmentLog.create({
      data: {
        jobId,
        cleanerId,
        branchId: auth.branchId!,
        outcome: "ASSIGNED",
        reason: "Branch operator assignment",
        details: { assignedBy: auth.operatorId },
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        preferredDate: updatedJob.preferredDate?.toISOString() ?? null,
        assignedAt: updatedJob.assignedAt?.toISOString() ?? null,
      },
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err) throw err;
    const message = err instanceof Error ? err.message : "Failed to assign job";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
