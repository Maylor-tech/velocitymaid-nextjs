/**
 * Phase L: Pricing Lock Functions
 * 
 * Manages immutable job pricing snapshots.
 * Once locked, pricing cannot be changed without void + rebook.
 */

import { prisma } from "@/lib/prisma";
import { Job, JobStatus } from "@prisma/client";

export interface PricingSnapshot {
  basePrice: number;
  modifiers: number;
  fees: number;
  tax: number;
  discountAmount: number | null;
  discountReason: string | null;
  totalPrice: number;
  currency: string;
  serviceType: string | null;
  pricingReferenceId: string | null;
  lockedAt: string; // ISO timestamp
  lockedBy: string; // Admin ID
}

/**
 * Check if job pricing is locked
 */
export function isPriceLocked(job: Job): boolean {
  return !!job.priceLockedAt;
}

/**
 * Assert that job pricing is not locked
 * Throws error if locked
 */
export function assertPriceUnlocked(job: Job): void {
  if (isPriceLocked(job)) {
    throw new Error(
      "Job pricing is locked. To change pricing, void this job and create a new booking."
    );
  }
}

/**
 * Lock job pricing when job is confirmed
 * Stores complete pricing snapshot
 */
export async function lockJobPricing(
  jobId: string,
  adminId: string,
  snapshot: PricingSnapshot
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      priceLockedAt: new Date(),
      pricingSnapshot: snapshot as any, // Prisma Json type
      pricingReferenceId: snapshot.pricingReferenceId,
      basePrice: snapshot.basePrice,
      modifiers: snapshot.modifiers,
      fees: snapshot.fees,
      tax: snapshot.tax,
      discountAmount: snapshot.discountAmount,
      discountReason: snapshot.discountReason,
      discountApprovedBy: adminId,
    },
  });
}

/**
 * Create pricing snapshot from current job state
 */
export function createPricingSnapshot(
  job: Job,
  adminId: string
): PricingSnapshot {
  return {
    basePrice: Number(job.basePrice || 0),
    modifiers: Number(job.modifiers || 0),
    fees: Number(job.fees || 0),
    tax: Number(job.tax || 0),
    discountAmount: job.discountAmount ? Number(job.discountAmount) : null,
    discountReason: job.discountReason || null,
    totalPrice: Number(job.totalPrice || 0),
    currency: job.currency || "USD",
    serviceType: job.serviceType || null,
    pricingReferenceId: job.pricingReferenceId || null,
    lockedAt: new Date().toISOString(),
    lockedBy: adminId,
  };
}

/**
 * Get pricing snapshot from job
 */
export function getPricingSnapshot(job: Job): PricingSnapshot | null {
  if (!job.priceLockedAt || !job.pricingSnapshot) {
    return null;
  }

  // If snapshot exists in JSON, use it
  if (typeof job.pricingSnapshot === 'object') {
    return job.pricingSnapshot as PricingSnapshot;
  }

  // Otherwise reconstruct from fields
  return {
    basePrice: Number(job.basePrice || 0),
    modifiers: Number(job.modifiers || 0),
    fees: Number(job.fees || 0),
    tax: Number(job.tax || 0),
    discountAmount: job.discountAmount ? Number(job.discountAmount) : null,
    discountReason: job.discountReason || null,
    totalPrice: Number(job.totalPrice || 0),
    currency: job.currency || "USD",
    serviceType: job.serviceType || null,
    pricingReferenceId: job.pricingReferenceId || null,
    lockedAt: job.priceLockedAt.toISOString(),
    lockedBy: job.discountApprovedBy || "system",
  };
}

/**
 * Check if job status allows pricing lock
 * Typically locks when job moves to CONFIRMED or ASSIGNED
 */
export function shouldLockPricing(status: JobStatus): boolean {
  return status === "CONFIRMED" || status === "ASSIGNED";
}










