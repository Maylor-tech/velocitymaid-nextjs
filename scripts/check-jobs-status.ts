/**
 * Check Jobs Status Script
 * 
 * Diagnostic script to see what jobs exist and their status
 * 
 * Usage:
 *   npx tsx scripts/check-jobs-status.ts
 */

import { prisma } from "../lib/prisma";
import { JobStatus } from "@prisma/client";

async function checkJobsStatus() {
  try {
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   JOBS STATUS DIAGNOSTIC                              ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Count jobs by status
    const statusCounts = await prisma.job.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    console.log("📊 Jobs by Status:");
    statusCounts.forEach((stat) => {
      console.log(`   ${stat.status}: ${stat._count.id}`);
    });

    // Check completed jobs
    console.log("\n✅ Completed Jobs:");
    const completedJobs = await prisma.job.findMany({
      where: { status: JobStatus.COMPLETED },
      select: {
        id: true,
        customerName: true,
        assignedCleanerId: true,
        totalPrice: true,
        completedAt: true,
        branchId: true,
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    });

    if (completedJobs.length === 0) {
      console.log("   ❌ No completed jobs found");
      console.log("\n💡 You need to complete a job first!");
      console.log("   Options:");
      console.log("   1. Complete a job via cleaner portal");
      console.log("    PATCH /api/cleaner/jobs/[jobId]/complete");
      console.log("   2. Or manually update a job status to COMPLETED");
    } else {
      console.log(`   Found ${completedJobs.length} completed job(s):\n`);
      completedJobs.forEach((job, idx) => {
        const hasCleaner = job.assignedCleanerId ? "✅" : "❌";
        console.log(`   ${idx + 1}. Job ${job.id.slice(0, 8)}...`);
        console.log(`      Customer: ${job.customerName || "Unknown"}`);
        console.log(`      Cleaner: ${hasCleaner} ${job.assignedCleanerId || "None"}`);
        console.log(`      Total: $${job.totalPrice || 0}`);
        console.log(`      Completed: ${job.completedAt?.toISOString() || "Unknown"}`);
        console.log(`      Branch: ${job.branchId}`);
        console.log("");
      });

      const jobsWithoutCleaner = completedJobs.filter((j) => !j.assignedCleanerId);
      if (jobsWithoutCleaner.length > 0) {
        console.log(`\n✅ Found ${jobsWithoutCleaner.length} completed job(s) without cleaner`);
        console.log("   → These can be assigned using the assign-cleaner script");
      } else {
        console.log("\n⚠️  All completed jobs already have cleaners assigned");
      }
    }

    // Check for any jobs that could be completed
    console.log("\n📋 Jobs That Could Be Completed:");
    const inProgressJobs = await prisma.job.findMany({
      where: {
        status: {
          in: [JobStatus.ASSIGNED, JobStatus.ON_THE_WAY, JobStatus.IN_PROGRESS],
        },
        assignedCleanerId: { not: null },
      },
      select: {
        id: true,
        status: true,
        customerName: true,
        assignedCleanerId: true,
        totalPrice: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (inProgressJobs.length === 0) {
      console.log("   No jobs in progress with cleaners");
    } else {
      console.log(`   Found ${inProgressJobs.length} job(s) that could be completed:\n`);
      inProgressJobs.forEach((job, idx) => {
        console.log(`   ${idx + 1}. Job ${job.id.slice(0, 8)}...`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Customer: ${job.customerName || "Unknown"}`);
        console.log(`      Cleaner: ${job.assignedCleanerId}`);
        console.log(`      Total: $${job.totalPrice || 0}`);
        console.log("");
      });
      console.log("   → These can be completed via cleaner portal or admin");
    }

    // Summary
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   SUMMARY                                               ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    const totalCompleted = completedJobs.length;
    const completedWithCleaner = completedJobs.filter((j) => j.assignedCleanerId).length;
    const completedWithoutCleaner = completedJobs.filter((j) => !j.assignedCleanerId).length;

    console.log(`Total Completed Jobs: ${totalCompleted}`);
    console.log(`  ✅ With Cleaner: ${completedWithCleaner}`);
    console.log(`  ❌ Without Cleaner: ${completedWithoutCleaner}`);

    if (totalCompleted === 0) {
      console.log("\n⚠️  ACTION NEEDED: Complete at least one job first");
    } else if (completedWithoutCleaner === 0) {
      console.log("\n⚠️  ACTION NEEDED: All completed jobs have cleaners");
      console.log("   → You may need to complete a new job, or");
      console.log("   → Manually set assignedCleanerId to null on a completed job for testing");
    } else {
      console.log(`\n✅ Ready: ${completedWithoutCleaner} job(s) can be assigned`);
    }

    return {
      totalCompleted,
      completedWithCleaner,
      completedWithoutCleaner,
      jobsWithoutCleaner: completedJobs.filter((j) => !j.assignedCleanerId),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return { error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  checkJobsStatus()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { checkJobsStatus };







