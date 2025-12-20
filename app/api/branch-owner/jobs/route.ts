/**
 * GET /api/branch-owner/jobs
 * POST /api/branch-owner/jobs (assign/reassign)
 * 
 * Branch owner job management
 * CAN: assign, reassign, cancel, flag
 * CANNOT: change pricing, mark paid, override completion
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getAuthenticatedBranchOwner } from "@/lib/auth/branchOwnerAuth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { hasBranchOwnerPermission } from "@/lib/permissions/branchOwner";

export const dynamic = "force-dynamic";

/**
 * GET - List jobs in branch
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "BRANCH_OWNER");
    const authResult = await getAuthenticatedBranchOwner(request);
    
    if (!authResult.success || !authResult.branchId) {
      return NextResponse.json(
        { success: false, error: "Branch owner not assigned to a branch" },
        { status: 403 }
      );
    }

    const branchId = authResult.branchId;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const filter = searchParams.get("filter"); // "attention" for jobs needing attention

    const where: any = {
      branchId,
      ...(statusFilter ? { status: statusFilter as JobStatus } : {}),
    };

    // Filter for jobs needing attention
    if (filter === "attention") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      where.status = { in: ["RECEIVED", "ASSIGNED", "CONFIRMED"] }; // Use enum values
      where.preferredDate = { lte: tomorrow };
    }

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        status: true,
        customerName: true,
        serviceType: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        // Phase L: Read-only pricing (branch owners can view but not edit)
        totalPrice: true,
        currency: true,
        priceLockedAt: true,
        assignedCleanerId: true,
        assignedAt: true,
        createdAt: true,
        completedAt: true,
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        User: {  // Relation name is "User", not "assignedCleaner"
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        preferredDate: "desc",
      },
      take: 100, // Limit to prevent overload
    });

    // Format dates
    const formattedJobs = jobs.map((job) => ({
      ...job,
      preferredDate: job.preferredDate?.toISOString() || null,
      assignedAt: job.assignedAt?.toISOString() || null,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      count: formattedJobs.length,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[BRANCH_OWNER_JOBS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch jobs",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Assign, reassign, cancel, or flag job
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "BRANCH_OWNER");
    const authResult = await getAuthenticatedBranchOwner(request);
    
    if (!authResult.success || !authResult.branchId || !authResult.branchOwnerId) {
      return NextResponse.json(
        { success: false, error: "Branch owner not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, jobId, cleanerId, reason, notes } = body;

    if (!action || !jobId) {
      return NextResponse.json(
        { success: false, error: "action and jobId are required" },
        { status: 400 }
      );
    }

    // Verify job belongs to branch
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        branchId: authResult.branchId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found or not in your branch" },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case "assign":
      case "reassign": {
        if (!hasBranchOwnerPermission("canAssignJobs")) {
          return NextResponse.json(
            { success: false, error: "Permission denied" },
            { status: 403 }
          );
        }

        if (!cleanerId) {
          return NextResponse.json(
            { success: false, error: "cleanerId is required for assignment" },
            { status: 400 }
          );
        }

        // Verify cleaner is in branch
        const cleaner = await prisma.user.findFirst({
          where: {
            id: cleanerId,
            role: "CLEANER",
            UserBranch: {
              some: {
                branchId: authResult.branchId,
              },
            },
          },
        });

        if (!cleaner) {
          return NextResponse.json(
            { success: false, error: "Cleaner not found or not in your branch" },
            { status: 404 }
          );
        }

        // Phase M: Check cleaner assignment eligibility (payment method required)
        const { checkCleanerAssignmentEligibility } = await import("@/lib/pilot/cleanerValidation");
        const eligibility = await checkCleanerAssignmentEligibility(cleanerId);

        if (!eligibility.eligible) {
          return NextResponse.json(
            {
              success: false,
              error: eligibility.reason || "Cleaner is not eligible for assignment",
              eligibility: {
                paymentMethod: eligibility.paymentMethod,
                blockers: eligibility.blockers,
              },
            },
            { status: 400 }
          );
        }

        // Phase M: Track assignment time for SLA
        const assignedAt = new Date();

        // Update job
        const updatedJob = await prisma.job.update({
          where: { id: jobId },
          data: {
            assignedCleanerId: cleanerId,
            assignedAt,
            status: job.status === "RECEIVED" || job.status === "CONFIRMED" ? "ASSIGNED" : job.status,
          },
        });

        // Phase M: Log assignment time for SLA tracking
        const jobCreatedAt = job.createdAt || new Date();
        const assignmentTimeMinutes = Math.round(
          (assignedAt.getTime() - jobCreatedAt.getTime()) / (1000 * 60)
        );
        console.log(
          `[PHASE_M_SLA] Job ${jobId} assigned in ${assignmentTimeMinutes} minutes (SLA: 60 minutes)`
        );

        // Log action
        await prisma.auditLog.create({
          data: {
            entityType: "Job",
            entityId: jobId,
            action: action === "assign" ? "JOB_ASSIGNED" : "JOB_REASSIGNED",
            actorRole: "BRANCH_OWNER",
            actorId: authResult.branchOwnerId,
            description: `Branch owner ${action === "assign" ? "assigned" : "reassigned"} job to cleaner`,
            changes: {
              cleanerId,
              previousCleanerId: job.assignedCleanerId,
              branchId: authResult.branchId,
            },
          },
        });

        return NextResponse.json({
          success: true,
          job: {
            id: updatedJob.id,
            assignedCleanerId: updatedJob.assignedCleanerId,
            status: updatedJob.status,
          },
          message: `Job ${action === "assign" ? "assigned" : "reassigned"} successfully`,
        });
      }

      case "cancel": {
        if (!hasBranchOwnerPermission("canCancelJobs")) {
          return NextResponse.json(
            { success: false, error: "Permission denied" },
            { status: 403 }
          );
        }

        if (!reason) {
          return NextResponse.json(
            { success: false, error: "reason is required for cancellation" },
            { status: 400 }
          );
        }

        const updatedJob = await prisma.job.update({
          where: { id: jobId },
          data: {
            status: "CANCELLED",
          },
        });

        // Log action
        await prisma.auditLog.create({
          data: {
            entityType: "Job",
            entityId: jobId,
            action: "JOB_CANCELLED",
            actorRole: "BRANCH_OWNER",
            actorId: authResult.branchOwnerId,
            description: `Branch owner cancelled job: ${reason}`,
            changes: {
              reason,
              notes: notes || null,
              branchId: authResult.branchId,
            },
          },
        });

        return NextResponse.json({
          success: true,
          job: {
            id: updatedJob.id,
            status: updatedJob.status,
          },
          message: "Job cancelled successfully",
        });
      }

      case "flag": {
        if (!hasBranchOwnerPermission("canFlagJobsForReview")) {
          return NextResponse.json(
            { success: false, error: "Permission denied" },
            { status: 403 }
          );
        }

        if (!reason) {
          return NextResponse.json(
            { success: false, error: "reason is required for flagging" },
            { status: 400 }
          );
        }

        // Log flag action
        await prisma.auditLog.create({
          data: {
            entityType: "Job",
            entityId: jobId,
            action: "JOB_FLAGGED_FOR_REVIEW",
            actorRole: "BRANCH_OWNER",
            actorId: authResult.branchOwnerId,
            description: `Branch owner flagged job for admin review: ${reason}`,
            changes: {
              reason,
              notes: notes || null,
              branchId: authResult.branchId,
              status: "FLAGGED",
            },
          },
        });

        return NextResponse.json({
          success: true,
          message: "Job flagged for admin review",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}. Must be assign, reassign, cancel, or flag` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[BRANCH_OWNER_JOBS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process job action",
      },
      { status: 500 }
    );
  }
}


