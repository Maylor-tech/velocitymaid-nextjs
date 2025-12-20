import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertTransition } from "@/lib/jobStatus";
import { logAuditEntry } from "@/lib/audit";
import { JobStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/requireRole";
import { shouldLockPricing, lockJobPricing, createPricingSnapshot, isPriceLocked } from "@/lib/pricing/lock";
// TODO: Implement createPayoutIfEligible function
// import { createPayoutIfEligible } from "@/src/server/payout/createPayoutIfEligible";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/jobs/[jobId]/status
 * 
 * Update job status with validation and audit logging
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    const jobId = params.jobId;
    const body = await req.json();
    const { toStatus } = body;

    if (!toStatus) {
      return NextResponse.json(
        { error: "Missing required field: toStatus" },
        { status: 400 }
      );
    }

    // Validate input - ensure toStatus is a valid JobStatus enum value
    // Prisma enums are string-based, so we can use the string directly
    const validStatuses = Object.values(JobStatus) as string[];
    const validKeys = Object.keys(JobStatus).filter(k => isNaN(Number(k)));
    
    // Check if toStatus is a valid enum value
    const isValidStatus = validStatuses.includes(toStatus) || validKeys.includes(toStatus);
    if (!isValidStatus) {
      return NextResponse.json(
        { 
          error: `Invalid job status: ${toStatus}. Must be one of: ${validKeys.join(", ")}`,
          received: toStatus,
          validStatuses: validKeys,
        },
        { status: 400 }
      );
    }

    // Prisma accepts enum strings directly - use the string value as-is
    // Convert to proper enum type for TypeScript
    const resolvedEnum = toStatus as JobStatus;

    // Find job (include pricing fields for auto-lock)
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        customerName: true,
        serviceType: true,
        assignedAt: true,
        completedAt: true,
        cancelledAt: true,
        // Phase L: Pricing fields for auto-lock
        priceLockedAt: true,
        totalPrice: true,
        basePrice: true,
        modifiers: true,
        fees: true,
        tax: true,
        discountAmount: true,
        discountReason: true,
        currency: true,
        pricingReferenceId: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Validate transition
    try {
      assertTransition(job.status, toStatus);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Prepare update data - use resolved enum value
    const updateData: any = {
      status: resolvedEnum,
    };

    // Set timestamps based on status transitions
    if (resolvedEnum === JobStatus.ASSIGNED && !job.assignedAt) {
      updateData.assignedAt = new Date();
    } else if (resolvedEnum === JobStatus.COMPLETED && !job.completedAt) {
      updateData.completedAt = new Date();
    } else if (resolvedEnum === JobStatus.CANCELLED && !job.cancelledAt) {
      updateData.cancelledAt = new Date();
    }

    // Log before update
    console.log("Updating job status:", {
      jobId,
      incoming: toStatus,
      resolvedEnum: resolvedEnum,
      currentStatus: job.status,
      updateData: updateData,
    });

    // Phase L: Auto-lock pricing if status changes to CONFIRMED or ASSIGNED
    if (shouldLockPricing(resolvedEnum) && !isPriceLocked(job as any)) {
      try {
        const snapshot = createPricingSnapshot(job as any, auth.userId);
        await lockJobPricing(jobId, auth.userId, snapshot);
        console.log(`[PHASE_L] Auto-locked pricing for job ${jobId} on status change to ${resolvedEnum}`);
      } catch (lockError: any) {
        console.error(`[PHASE_L] Failed to auto-lock pricing for job ${jobId}:`, lockError);
        // Don't block status update if lock fails - log and continue
      }
    }

    // Update job with proper error handling
    let updatedJob;
    try {
      updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: updateData,
        select: {
          id: true,
          status: true,
          customerName: true,
          serviceType: true,
        },
      });
    } catch (error: any) {
      console.error('Job update error:', error);
      console.error('Error details:', {
        code: error?.code,
        meta: error?.meta,
        message: error?.message,
        updateData: updateData,
        resolvedEnum: resolvedEnum,
        toStatus: toStatus,
      });
      return NextResponse.json(
        { 
          error: String(error?.message || error),
          details: error?.meta,
          code: error?.code,
        },
        { status: 500 }
      );
    }

    // Log audit entry (non-blocking)
    logAuditEntry({
      action: "JOB_STATUS_UPDATED",
      entityType: "Job",
      entityId: jobId,
      description: `Job status changed from ${job.status} to ${toStatus}`,
      changes: {
        from: job.status,
        to: toStatus,
        jobId: jobId,
        customerName: job.customerName,
      },
    }).catch((err) => {
      console.error("[AUDIT] Failed to log status update:", err);
    });

    console.log(`[ADMIN] Job ${jobId} status updated: ${job.status} → ${toStatus}`);

    // Auto-generate payout when job transitions to COMPLETED
    if (job.status !== JobStatus.COMPLETED && resolvedEnum === JobStatus.COMPLETED) {
      console.log(`[ADMIN] Job ${jobId} completed - triggering automatic payout generation`);
      
      // Import generatePayouts dynamically to avoid circular dependencies
      const { generatePayouts } = await import("@/workers/generatePayouts");
      
      // Generate payout for this specific job (non-blocking, errors don't rollback job completion)
      generatePayouts({
        jobId: updatedJob.id,
        triggeredBy: "JOB_COMPLETION",
      }).then((result) => {
        if (result.created > 0) {
          console.log(`[ADMIN] Payout created for job ${jobId}: ${result.created} payout(s)`);
        } else if (result.skipped_no_cleaner > 0) {
          console.log(`[ADMIN] Payout skipped for job ${jobId}: no cleaner assigned`);
        } else if (result.skipped_no_policy > 0) {
          console.log(`[ADMIN] Payout skipped for job ${jobId}: no active policy`);
        } else if (result.skipped_already_exists > 0) {
          console.log(`[ADMIN] Payout skipped for job ${jobId}: payout already exists`);
        } else if (result.errors > 0) {
          console.error(`[ADMIN] Payout generation failed for job ${jobId}:`, result.errorDetails);
        }
      }).catch((error) => {
        // Log error but don't throw - job completion should not be rolled back
        console.error(`[ADMIN] Error generating payout for job ${jobId}:`, error);
      });
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (err: any) {
    console.error("[ADMIN] Status update error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update job status" },
      { status: 500 }
    );
  }
}

// Keep POST for backward compatibility, but prefer PATCH
export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  return PATCH(req, { params });
}

