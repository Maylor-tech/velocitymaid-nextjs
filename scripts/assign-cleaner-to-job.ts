/**
 * Quick script to assign a cleaner to a completed job
 * 
 * Usage:
 *   npx tsx scripts/assign-cleaner-to-job.ts
 * 
 * Or run via API:
 *   POST /api/admin/scripts/assign-cleaner
 */

import { prisma } from "../lib/prisma";
import { JobStatus } from "@prisma/client";

async function assignCleanerToJob() {
  try {
    console.log("[ASSIGN_CLEANER] Starting...");

    // Step 1: Find an approved cleaner
    // Try CleanerApplication first (if it has a cleanerId field)
    let cleanerId: string | null = null;

    // First, try to find a User with role CLEANER and isActive=true
    const cleanerUser = await prisma.user.findFirst({
      where: {
        role: "CLEANER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (cleanerUser) {
      cleanerId = cleanerUser.id;
      console.log(`[ASSIGN_CLEANER] Found active cleaner User: ${cleanerUser.id} (${cleanerUser.name || cleanerUser.email})`);
    } else {
      // Fallback: Try CleanerApplication with APPROVED status
      const cleanerApp = await prisma.cleanerApplication.findFirst({
        where: { status: "APPROVED" },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      if (cleanerApp) {
        // Find or create User from CleanerApplication
        let user = await prisma.user.findFirst({
          where: { email: cleanerApp.email },
        });

        if (!user) {
          // Create user from approved application
          user = await prisma.user.create({
            data: {
              email: cleanerApp.email,
              name: cleanerApp.name,
              role: "CLEANER",
              isActive: true,
            },
          });
          console.log(`[ASSIGN_CLEANER] Created User from CleanerApplication: ${user.id}`);
        }

        cleanerId = user.id;
        console.log(`[ASSIGN_CLEANER] Using User from approved CleanerApplication: ${cleanerId}`);
      }
    }

    if (!cleanerId) {
      console.error("[ASSIGN_CLEANER] No approved cleaner found!");
      return { success: false, error: "No approved cleaner found" };
    }

    // Step 2: Find a completed job without an assigned cleaner
    const completedJob = await prisma.job.findFirst({
      where: {
        status: JobStatus.COMPLETED,
        assignedCleanerId: null,
      },
      select: {
        id: true,
        customerName: true,
        serviceType: true,
        totalPrice: true,
        completedAt: true,
      },
      orderBy: {
        completedAt: "desc", // Most recently completed first
      },
    });

    if (!completedJob) {
      console.error("[ASSIGN_CLEANER] No completed job without cleaner found!");
      return { success: false, error: "No completed job without cleaner found" };
    }

    console.log(`[ASSIGN_CLEANER] Found completed job: ${completedJob.id} (${completedJob.customerName || "Unknown"})`);

    // Step 3: Assign the cleaner to the job
    const updatedJob = await prisma.job.update({
      where: { id: completedJob.id },
      data: { assignedCleanerId: cleanerId },
      select: {
        id: true,
        status: true,
        assignedCleanerId: true,
        customerName: true,
      },
    });

    console.log(`[ASSIGN_CLEANER] ✅ Successfully assigned cleaner ${cleanerId} to job ${updatedJob.id}`);
    console.log(`[ASSIGN_CLEANER] Job: ${updatedJob.customerName || "Unknown"}, Status: ${updatedJob.status}`);

    return {
      success: true,
      jobId: updatedJob.id,
      cleanerId: cleanerId,
      message: `Cleaner ${cleanerId} assigned to job ${updatedJob.id}`,
    };
  } catch (error: any) {
    console.error("[ASSIGN_CLEANER] Error:", error);
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
  assignCleanerToJob()
    .then((result) => {
      console.log("\n[ASSIGN_CLEANER] Result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("[ASSIGN_CLEANER] Fatal error:", error);
      process.exit(1);
    });
}

export { assignCleanerToJob };

