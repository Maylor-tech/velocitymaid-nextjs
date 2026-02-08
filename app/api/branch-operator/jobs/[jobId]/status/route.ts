/**
 * PATCH /api/branch-operator/jobs/[jobId]/status
 *
 * Updates job status. Job must belong to operator's branch.
 * Allowed transitions: pending, assigned, in_progress, completed, cancelled.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireBranchOperator } from "@/lib/auth/branchOperatorAuth";
import { prisma } from "@/lib/prisma";
import { sendArrivalNotificationIfNeeded } from "@/lib/notifications/arrivalWhatsApp";
import { grantLoyaltyCreditIfEligible } from "@/lib/notifications/loyaltyCredit";
import { sendSubscriptionUpsellIfEligible } from "@/lib/notifications/subscriptionUpsell";

const ALLOWED_STATUSES = [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
  "RECEIVED",
  "CONFIRMED",
  "ASSIGNED",
  "REASSIGN_PENDING",
];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const auth = await requireBranchOperator(request);
    const { jobId } = await params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (!jobId || !status) {
      return NextResponse.json(
        { success: false, error: "jobId and status are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, branchId: auth.branchId! },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const data: { status: string; onTheWayAt?: Date; completedAt?: Date } = {
      status,
    };
    if (status === "in_progress" || status === "ASSIGNED") {
      data.onTheWayAt = job.onTheWayAt ?? new Date();
    }
    if (status === "completed") {
      data.completedAt = new Date();
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        Branch: { select: { id: true, name: true, slug: true } },
        User: { select: { id: true, name: true, email: true } },
      },
    });

    // "We've arrived" WhatsApp when check-in (onTheWayAt) is set for the first time
    if (job.onTheWayAt == null && data.onTheWayAt) {
      sendArrivalNotificationIfNeeded(jobId).catch(() => {});
    }

    if (status === "completed") {
      grantLoyaltyCreditIfEligible(jobId).catch(() => {});
      sendSubscriptionUpsellIfEligible(jobId).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        onTheWayAt: updatedJob.onTheWayAt?.toISOString() ?? null,
        completedAt: updatedJob.completedAt?.toISOString() ?? null,
      },
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err) throw err;
    const message = err instanceof Error ? err.message : "Failed to update status";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
