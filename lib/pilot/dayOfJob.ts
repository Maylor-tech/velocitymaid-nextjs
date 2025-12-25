/**
 * Phase M: Day-of-Job Operations
 * 
 * System checks when cleaner completes job:
 * - Completion timestamp
 * - Payout eligibility
 * - Snapshot integrity
 * - Issue escalation
 */

import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export interface JobCompletionCheck {
  passed: boolean;
  timestamp: Date;
  payoutEligible: boolean;
  snapshotIntact: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Verify job completion integrity
 * Phase M: System checks (timestamp, payout eligibility, snapshot integrity)
 */
export async function verifyJobCompletion(jobId: string): Promise<JobCompletionCheck> {
  const issues: string[] = [];
  const warnings: string[] = [];

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      completedAt: true,
      assignedCleanerId: true,
      priceLockedAt: true,
      pricingSnapshot: true,
      totalPrice: true,
      basePrice: true,
      payoutStatus: true,
      preferredDate: true,
      preferredTime: true,
    },
  });

  if (!job) {
    return {
      passed: false,
      timestamp: new Date(),
      payoutEligible: false,
      snapshotIntact: false,
      issues: ["Job not found"],
      warnings: [],
    };
  }

  // Check 1: Completion timestamp
  const timestamp = job.completedAt || new Date();
  if (!job.completedAt) {
    issues.push("Completion timestamp missing");
  }

  // Check 2: Status must be COMPLETED
  if (job.status !== JobStatus.COMPLETED) {
    issues.push(`Job status is ${job.status}, expected COMPLETED`);
  }

  // Check 3: Payout eligibility
  let payoutEligible = true;
  if (!job.assignedCleanerId) {
    payoutEligible = false;
    issues.push("No cleaner assigned - payout not eligible");
  }
  if (!job.totalPrice || Number(job.totalPrice) <= 0) {
    payoutEligible = false;
    issues.push("Job has no price - payout not eligible");
  }

  // Check 4: Snapshot integrity (Phase L)
  let snapshotIntact = true;
  if (!job.priceLockedAt) {
    snapshotIntact = false;
    warnings.push("Pricing not locked - snapshot may be missing");
  }
  if (!job.pricingSnapshot) {
    snapshotIntact = false;
    warnings.push("Pricing snapshot missing");
  } else {
    // Verify snapshot structure
    try {
      const snapshot = job.pricingSnapshot as any;
      if (!snapshot.basePrice && !snapshot.totalPrice) {
        snapshotIntact = false;
        warnings.push("Pricing snapshot missing price data");
      }
    } catch (error) {
      snapshotIntact = false;
      warnings.push("Pricing snapshot invalid format");
    }
  }

  // Check 5: Job date validation
  if (job.preferredDate) {
    const jobDate = new Date(job.preferredDate);
    const now = new Date();
    const daysDiff = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 0) {
      warnings.push("Job completed before scheduled date");
    } else if (daysDiff > 7) {
      warnings.push("Job completed more than 7 days after scheduled date");
    }
  }

  const passed = issues.length === 0;

  return {
    passed,
    timestamp,
    payoutEligible,
    snapshotIntact,
    issues,
    warnings,
  };
}

/**
 * Create escalation for job issue
 * Phase M: Issue escalation to Admin (not WhatsApp chaos)
 */
export async function escalateJobIssue(
  jobId: string,
  issueType: "CLEANER_ISSUE" | "JOB_DISPUTE" | "CUSTOMER_COMPLAINT" | "TECHNICAL_ISSUE",
  reportedBy: "CLEANER" | "BRANCH_OWNER" | "CUSTOMER" | "SYSTEM",
  reporterId: string | null,
  reason: string,
  notes?: string
): Promise<{
  success: boolean;
  escalationId?: string;
  error?: string;
}> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        customerName: true,
        assignedCleanerId: true,
        branchId: true,
        status: true,
      },
    });

    if (!job) {
      return {
        success: false,
        error: "Job not found",
      };
    }

    // Create escalation record
    const escalation = await prisma.auditLog.create({
      data: {
        entityType: "Escalation",
        entityId: `esc_${Date.now()}_${jobId}`,
        action: "ESCALATION_CREATED",
        actorRole: reportedBy,
        actorId: reporterId,
        description: `Escalation: ${issueType} - ${reason}`,
        changes: {
          issueType,
          reason,
          notes: notes || null,
          jobId,
          branchId: job.branchId,
          assignedCleanerId: job.assignedCleanerId,
          jobStatus: job.status,
        },
      },
    });

    // TODO: Send admin notification
    // This could be:
    // - Email notification
    // - In-app notification
    // - Slack webhook
    // - Admin dashboard alert

    console.log(`[PHASE_M] Escalation created for job ${jobId}: ${issueType} - ${reason}`);

    return {
      success: true,
      escalationId: escalation.id,
    };
  } catch (error: any) {
    console.error(`[PHASE_M] Error creating escalation:`, error);
    return {
      success: false,
      error: error.message || "Failed to create escalation",
    };
  }
}

/**
 * Check if job completion needs escalation
 * Phase M: If issue → Escalate to Admin
 */
export async function checkJobCompletionIssues(jobId: string): Promise<{
  needsEscalation: boolean;
  issues: string[];
  escalationCreated: boolean;
}> {
  const check = await verifyJobCompletion(jobId);
  
  if (check.issues.length > 0) {
    // Escalate critical issues
    const escalation = await escalateJobIssue(
      jobId,
      "TECHNICAL_ISSUE",
      "SYSTEM",
      null,
      `Job completion check failed: ${check.issues.join(", ")}`,
      `Issues: ${check.issues.join("; ")}\nWarnings: ${check.warnings.join("; ")}`
    );

    return {
      needsEscalation: true,
      issues: check.issues,
      escalationCreated: escalation.success,
    };
  }

  return {
    needsEscalation: false,
    issues: [],
    escalationCreated: false,
  };
}











