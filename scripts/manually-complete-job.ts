/**
 * Manually Complete a Job (for testing)
 * 
 * This script finds an IN_PROGRESS or ASSIGNED job and marks it as COMPLETED.
 * Useful for testing when you need a completed job quickly.
 * 
 * Usage:
 *   npx tsx scripts/manually-complete-job.ts [jobId]
 */

import { prisma } from "../lib/prisma";
import { JobStatus } from "@prisma/client";

async function manuallyCompleteJob(jobId?: string) {
  try {
    console.log("[MANUAL_COMPLETE] Starting...");

    let job;

    if (jobId) {
      // Use provided job ID
      job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          status: true,
          assignedCleanerId: true,
          totalPrice: true,
          branchId: true,
          customerName: true,
        },
      });

      if (!job) {
        console.error(`[MANUAL_COMPLETE] Job ${jobId} not found`);
        return { success: false, error: "Job not found" };
      }
    } else {
      // Find a job that can be completed
      job = await prisma.job.findFirst({
        where: {
          status: {
            in: [JobStatus.ASSIGNED, JobStatus.ON_THE_WAY, JobStatus.IN_PROGRESS],
          },
          assignedCleanerId: { not: null },
        },
        select: {
          id: true,
          status: true,
          assignedCleanerId: true,
          totalPrice: true,
          branchId: true,
          customerName: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!job) {
        console.error("[MANUAL_COMPLETE] No eligible job found");
        console.log("   Looking for jobs with status: ASSIGNED, ON_THE_WAY, or IN_PROGRESS");
        console.log("   And must have assignedCleanerId set");
        return { success: false, error: "No eligible job found" };
      }
    }

    console.log(`[MANUAL_COMPLETE] Found job: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Cleaner: ${job.assignedCleanerId}`);
    console.log(`   Total: $${job.totalPrice || 0}`);

    if (job.status === JobStatus.COMPLETED) {
      console.log("[MANUAL_COMPLETE] Job is already COMPLETED");
      return {
        success: true,
        message: "Job already completed",
        jobId: job.id,
      };
    }

    // Update job to COMPLETED
    const updatedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        payoutStatus: "PENDING",
        ratingStatus: "PENDING",
      },
      select: {
        id: true,
        status: true,
        completedAt: true,
        assignedCleanerId: true,
      },
    });

    console.log(`[MANUAL_COMPLETE] ✅ Job ${updatedJob.id} marked as COMPLETED`);
    console.log(`   Completed at: ${updatedJob.completedAt?.toISOString()}`);

    // Try to create payout if eligible
    try {
      const { createPayoutIfEligible } = await import(
        "../src/server/payout/createPayoutIfEligible"
      );
      const payoutResult = await createPayoutIfEligible(updatedJob.id);
      if (payoutResult.ok) {
        console.log(`[MANUAL_COMPLETE] ✅ Payout created: ${payoutResult.payoutId}`);
      } else {
        console.log(`[MANUAL_COMPLETE] ⚠️  Payout not created: ${payoutResult.reason}`);
      }
    } catch (error: any) {
      console.log(`[MANUAL_COMPLETE] ⚠️  Could not create payout: ${error.message}`);
      console.log("   (This is okay - payout can be created later)");
    }

    return {
      success: true,
      jobId: updatedJob.id,
      message: `Job ${updatedJob.id} marked as COMPLETED`,
    };
  } catch (error: any) {
    console.error("[MANUAL_COMPLETE] Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  const jobId = process.argv[2];
  manuallyCompleteJob(jobId)
    .then((result) => {
      console.log("\n[MANUAL_COMPLETE] Result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("[MANUAL_COMPLETE] Fatal error:", error);
      process.exit(1);
    });
}

export { manuallyCompleteJob };







