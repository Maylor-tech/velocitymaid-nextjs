/**
 * POST /api/branch-operator/jobs/[jobId]/notes
 *
 * Adds an assignment log entry (notes) for a job. Job must belong to operator's branch.
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
    const { reason, details } = body as { reason?: string; details?: unknown };

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, branchId: auth.branchId! },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const log = await prisma.assignmentLog.create({
      data: {
        jobId,
        branchId: auth.branchId!,
        outcome: "NOTE",
        reason: reason ?? "Branch operator note",
        details:
          details !== undefined
            ? (typeof details === "object" && details !== null ? details : { value: details })
            : { addedBy: auth.operatorId },
      },
    });

    return NextResponse.json({
      success: true,
      log: {
        id: log.id,
        jobId: log.jobId,
        outcome: log.outcome,
        reason: log.reason,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err) throw err;
    const message = err instanceof Error ? err.message : "Failed to add note";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
