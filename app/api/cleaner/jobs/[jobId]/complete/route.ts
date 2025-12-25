import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { JobStatus } from "@prisma/client";
import { createPayoutIfEligible } from "../../../../../src/server/payout/createPayoutIfEligible";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/cleaner/jobs/[jobId]/complete
 * 
 * Cleaner marks a job as completed
 * - Verifies cleaner identity
 * - Confirms job exists + assignedCleanerId matches
 * - Updates job: status = COMPLETED, completedAt = now(), payoutStatus = PENDING, ratingStatus = PENDING
 * - Creates JobPayout record (PENDING)
 * - Creates AuditLog entries for completion, payout, and rating request
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
      include: {
        Customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        Branch: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // 4. Enforce strict status guard: must be IN_PROGRESS
    if (job.status !== JobStatus.IN_PROGRESS) {
      return NextResponse.json(
        { 
          error: `Job cannot be completed. Current status: ${job.status}. Must be IN_PROGRESS.`,
          currentStatus: job.status,
          requiredStatus: "IN_PROGRESS",
        },
        { status: 400 }
      );
    }

    // 5. Calculate payout amount (use totalPrice or default calculation)
    // For now, use 70% of totalPrice as cleaner earnings (adjust as needed)
    const totalPrice = job.totalPrice ? Number(job.totalPrice) : 0;
    const payoutAmount = totalPrice > 0 ? totalPrice * 0.7 : 0; // 70% to cleaner, 30% to branch

    // Phase M: System checks will run after completion
    const completionTimestamp = new Date();

    // 6. Use transaction to update job, create payout, and log audit entries
    const result = await prisma.$transaction(async (tx) => {
      // Update job status and timestamps
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: completionTimestamp,
          payoutStatus: "PENDING",
          ratingStatus: "PENDING",
        },
        select: {
          id: true,
          status: true,
          completedAt: true,
          payoutStatus: true,
          ratingStatus: true,
          totalPrice: true,
          currency: true,
        },
      });

      // Create JobPayout record
      const payout = await tx.jobPayout.create({
        data: {
          jobId: jobId,
          cleanerId: cleanerId,
          branchId: job.branchId,
          amount: payoutAmount,
          currency: job.currency || "USD",
          status: "PENDING",
        },
        select: {
          id: true,
          jobId: true,
          cleanerId: true,
          amount: true,
          currency: true,
          status: true,
        },
      });

      // Log audit entry for job completion
      await tx.auditLog.create({
        data: {
          actorId: cleanerId,
          actorRole: "CLEANER",
          action: "JOB_COMPLETED",
          entityType: "Job",
          entityId: jobId,
          description: `Job marked COMPLETED by cleaner ${authResult.cleaner?.name || cleanerId}`,
          changes: {
            previousStatus: job.status,
            newStatus: JobStatus.COMPLETED,
            completedAt: updatedJob.completedAt?.toISOString(),
            cleanerId: cleanerId,
          },
        },
      });

      // Log audit entry for payout creation
      await tx.auditLog.create({
        data: {
          actorId: cleanerId,
          actorRole: "CLEANER",
          action: "PAYOUT_CREATED",
          entityType: "JobPayout",
          entityId: payout.id,
          description: `Cleaner payout created (PENDING) for job ${jobId}`,
          changes: {
            payoutId: payout.id,
            amount: payoutAmount,
            currency: payout.currency,
            status: "PENDING",
            jobId: jobId,
          },
        },
      });

      // Log audit entry for rating request
      await tx.auditLog.create({
        data: {
          actorId: cleanerId,
          actorRole: "CLEANER",
          action: "RATING_REQUESTED",
          entityType: "Job",
          entityId: jobId,
          description: `Customer rating requested (PENDING) for job ${jobId}`,
          changes: {
            ratingStatus: "PENDING",
            jobId: jobId,
            customerId: job.customerId,
          },
        },
      });

      return { updatedJob, payout };
    });

    console.log(`[CLEANER] Job ${jobId} completed by cleaner ${cleanerId}`);

    // Phase M: System checks after completion
    try {
      const { verifyJobCompletion, checkJobCompletionIssues } = await import("../../../../../../lib/pilot/dayOfJob");
      const completionCheck = await verifyJobCompletion(jobId);
      
      if (!completionCheck.passed) {
        console.warn(`[PHASE_M] Job ${jobId} completion check failed:`, completionCheck.issues);
        
        // Escalate if there are critical issues
        await checkJobCompletionIssues(jobId);
      } else if (completionCheck.warnings.length > 0) {
        console.warn(`[PHASE_M] Job ${jobId} completion warnings:`, completionCheck.warnings);
      } else {
        console.log(`[PHASE_M] Job ${jobId} completion check passed`);
      }
    } catch (checkError: any) {
      console.error(`[PHASE_M] Error running completion checks:`, checkError);
      // Don't fail job completion if checks fail
    }

    return NextResponse.json({
      success: true,
      job: result.updatedJob,
      payout: result.payout,
      message: "Job completed successfully. Payout created and rating requested.",
    });
  } catch (err: any) {
    console.error("[CLEANER_COMPLETE] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to complete job" },
      { status: 500 }
    );
  }
}

