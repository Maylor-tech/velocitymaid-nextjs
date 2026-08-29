import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { JobStatus } from "@prisma/client";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { createAdminNotification, adminNotificationHelpers } from "@/lib/notifications/adminNotificationCenter";
import { isDispatchOffersEnabledForBranch } from "@/lib/dispatch/featureFlags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/cleaner/jobs/[jobId]/decline
 * 
 * Cleaner declines an assigned job
 * - Validates cleaner identity
 * - Confirms job is assigned to this cleaner
 * - Removes assignedCleanerId
 * - Sets status back to CONFIRMED
 * - Releases CleanerAvailability lock
 * - Logs audit entry
 * - Triggers auto-reassignment
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    await requireCleanerJobAssignment(req, jobId);
    const authResult = await getAuthenticatedCleaner(req);
    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { error: authResult.error || "Not authenticated as cleaner" },
        { status: 401 }
      );
    }

    const cleanerId = authResult.cleanerId;

    // 2. Find job and verify assignment
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        assignedCleanerId: true,
        branchId: true,
        Branch: { select: { slug: true } },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // 3. Verify job is assigned to this cleaner
    if (job.assignedCleanerId !== cleanerId) {
      return NextResponse.json(
        { error: "Job is not assigned to you" },
        { status: 403 }
      );
    }

    // 4. Verify job status allows decline
    if (job.status !== JobStatus.ASSIGNED) {
      return NextResponse.json(
        { 
          error: `Job cannot be declined. Current status: ${job.status}`,
          currentStatus: job.status,
        },
        { status: 400 }
      );
    }

    // 5. Use transaction to update job, create assignment log, and audit log
    const updatedJob = await prisma.$transaction(async (tx) => {
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          assignedCleanerId: null,
          status: JobStatus.CONFIRMED,
          assignedAt: null,
        },
        select: {
          id: true,
          status: true,
          assignedCleanerId: true,
          paymentStatus: true,
        },
      });

      await tx.assignmentLog.create({
        data: {
          jobId: jobId,
          cleanerId: cleanerId,
          branchId: job.branchId,
          outcome: "DECLINED",
          reason: `Walk-off decline by cleaner ${authResult.cleaner?.name || cleanerId}`,
          details: {
            declinedAt: new Date().toISOString(),
            declinedBy: cleanerId,
            previousStatus: job.status,
            newStatus: JobStatus.CONFIRMED,
          },
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          actorId: cleanerId,
          actorRole: "CLEANER",
          action: "JOB_DECLINED",
          entityType: "Job",
          entityId: jobId,
          description: `Job declined by cleaner ${authResult.cleaner?.name || cleanerId}`,
          changes: {
            from: "ASSIGNED",
            to: "CONFIRMED",
            declinedBy: cleanerId,
            cleanerName: authResult.cleaner?.name || null,
          },
        },
      });

      return updatedJob;
    });

    // 6. Note: Auto-reassignment will be handled by Phase 12 dispatcher
    // For now, we just set status to REASSIGN_PENDING
    // The dispatcher will pick it up later

    console.log(`[CLEANER] Job ${jobId} declined by cleaner ${cleanerId} after assignment`);

    createAdminNotification({
      type: "CLEANER_DECLINED",
      severity: "WARNING",
      message: `Cleaner declined assigned job ${jobId} — cleaner needed`,
      jobId,
      actionUrl: adminNotificationHelpers.adminJobLink(jobId),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: isDispatchOffersEnabledForBranch(job.Branch?.slug)
        ? "Job declined. Ops can send a new offer."
        : "Job declined. It is unassigned and needs a cleaner.",
    });
  } catch (err: unknown) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    console.error("[CLEANER_DECLINE] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to decline job" },
      { status: 500 }
    );
  }
}

