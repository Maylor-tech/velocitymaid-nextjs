/**
 * Phase L: Cancellation & Refund Rules
 * 
 * Formula-based refund calculations with audit logging.
 * No ad-hoc refunds. Ever.
 */

import { prisma } from "../prisma";
import { getPricingSnapshot } from "./lock";

export interface RefundCalculation {
  basePrice: number;
  cancellationFee: number;
  refundAmount: number;
  feeReason: string;
  calculation: {
    hoursUntilJob: number;
    cancellationWindow: "24h" | "48h" | "none";
    feePercentage: number;
  };
}

export interface RefundRequest {
  jobId: string;
  reason: string;
  adminId: string;
  overrideFee?: boolean; // Admin can override with reason
  overrideReason?: string;
}

/**
 * Calculate cancellation fee based on timing
 */
export function calculateCancellationFee(
  jobDate: Date,
  cancellationDate: Date = new Date()
): {
  feePercentage: number;
  feeAmount: number;
  window: "24h" | "48h" | "none";
  hoursUntilJob: number;
} {
  const hoursUntilJob = (jobDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);
  
  let feePercentage = 0;
  let window: "24h" | "48h" | "none" = "none";

  if (hoursUntilJob < 24) {
    // Less than 24 hours: 50% fee
    feePercentage = 50;
    window = "24h";
  } else if (hoursUntilJob < 48) {
    // 24-48 hours: 25% fee
    feePercentage = 25;
    window = "48h";
  } else {
    // More than 48 hours: No fee
    feePercentage = 0;
    window = "none";
  }

  return {
    feePercentage,
    feeAmount: 0, // Will be calculated with base price
    window,
    hoursUntilJob: Math.max(0, hoursUntilJob),
  };
}

/**
 * Calculate refund for a job
 * Uses pricing snapshot if available
 */
export async function calculateRefund(
  jobId: string,
  overrideFee: boolean = false
): Promise<RefundCalculation> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      totalPrice: true,
      preferredDate: true,
      priceLockedAt: true,
      pricingSnapshot: true,
      basePrice: true,
      modifiers: true,
      fees: true,
      tax: true,
      discountAmount: true,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (!job.preferredDate) {
    throw new Error("Job date not set");
  }

  // Get base price from snapshot or current value
  const snapshot = getPricingSnapshot(job as any);
  const basePrice = snapshot?.basePrice || Number(job.basePrice || job.totalPrice || 0);

  // Calculate cancellation fee
  const feeCalc = calculateCancellationFee(job.preferredDate);

  // Admin override: no fee
  const feePercentage = overrideFee ? 0 : feeCalc.feePercentage;
  const cancellationFee = (basePrice * feePercentage) / 100;
  const refundAmount = Math.max(0, basePrice - cancellationFee);

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    cancellationFee: Math.round(cancellationFee * 100) / 100,
    refundAmount: Math.round(refundAmount * 100) / 100,
    feeReason: overrideFee
      ? "Admin override - fee waived"
      : feeCalc.window === "none"
      ? "Cancelled more than 48 hours before job"
      : `Cancelled ${feeCalc.window} before job - ${feePercentage}% fee applies`,
    calculation: {
      hoursUntilJob: feeCalc.hoursUntilJob,
      cancellationWindow: feeCalc.window,
      feePercentage,
    },
  };
}

/**
 * Process refund (with audit logging)
 */
export async function processRefund(
  request: RefundRequest
): Promise<{
  success: boolean;
  refund: RefundCalculation;
  error?: string;
}> {
  try {
    // Calculate refund
    const refund = await calculateRefund(request.jobId, request.overrideFee || false);

    // Log refund in audit log
    await prisma.auditLog.create({
      data: {
        entityType: "Job",
        entityId: request.jobId,
        action: "REFUND_PROCESSED",
        actorRole: "ADMIN",
        actorId: request.adminId,
        description: `Refund processed: ${request.reason}`,
        changes: {
          refundAmount: refund.refundAmount,
          cancellationFee: refund.cancellationFee,
          feeReason: refund.feeReason,
          overrideFee: request.overrideFee || false,
          overrideReason: request.overrideReason || null,
          calculation: refund.calculation,
        },
      },
    });

    return {
      success: true,
      refund,
    };
  } catch (error: any) {
    return {
      success: false,
      refund: {
        basePrice: 0,
        cancellationFee: 0,
        refundAmount: 0,
        feeReason: "Error calculating refund",
        calculation: {
          hoursUntilJob: 0,
          cancellationWindow: "none",
          feePercentage: 0,
        },
      },
      error: error.message || "Failed to process refund",
    };
  }
}

/**
 * Check if job is a no-show (completed but marked as no-show)
 */
export function isNoShow(job: { status: string; completedAt: Date | null }): boolean {
  // No-show logic: job was scheduled but never completed
  // This would be tracked separately, but for now we check status
  return (job.status === "CANCELLED" || job.status === "CANCELLED_EMERGENCY") && !job.completedAt;
}

/**
 * Calculate no-show fee (typically 100% of base price)
 */
export function calculateNoShowFee(basePrice: number): number {
  return basePrice; // Full price as no-show fee
}











