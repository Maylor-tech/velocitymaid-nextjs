/**
 * Phase L: Pricing Lock Functions
 * 
 * Manages immutable job pricing snapshots.
 * Once locked, pricing cannot be changed without void + rebook.
 */

import { prisma } from "../prisma";
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
  const priced = job as LooseAny;
  return !!priced.priceLockedAt;
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
      pricingSnapshot: snapshot as LooseAny, // Prisma Json type
      pricingReferenceId: snapshot.pricingReferenceId,
      basePrice: snapshot.basePrice,
      modifiers: snapshot.modifiers,
      fees: snapshot.fees,
      tax: snapshot.tax,
      discountAmount: snapshot.discountAmount,
      discountReason: snapshot.discountReason,
      discountApprovedBy: adminId,
    } as LooseAny,
  });
}

/**
 * Create pricing snapshot from current job state
 */
export function createPricingSnapshot(
  job: Job,
  adminId: string
): PricingSnapshot {
  const priced = job as LooseAny;
  return {
    basePrice: Number(priced.basePrice || 0),
    modifiers: Number(priced.modifiers || 0),
    fees: Number(priced.fees || 0),
    tax: Number(priced.tax || 0),
    discountAmount: priced.discountAmount ? Number(priced.discountAmount) : null,
    discountReason: priced.discountReason || null,
    totalPrice: Number(priced.totalPrice || 0),
    currency: priced.currency || "USD",
    serviceType: priced.serviceType || null,
    pricingReferenceId: priced.pricingReferenceId || null,
    lockedAt: new Date().toISOString(),
    lockedBy: adminId,
  };
}

/**
 * Get pricing snapshot from job
 */
export function getPricingSnapshot(job: Job): PricingSnapshot | null {
  const priced = job as LooseAny;
  if (!priced.priceLockedAt || !priced.pricingSnapshot) {
    return null;
  }

  // If snapshot exists in JSON, use it
  if (typeof priced.pricingSnapshot === "object") {
    return priced.pricingSnapshot as PricingSnapshot;
  }

  // Otherwise reconstruct from fields
  return {
    basePrice: Number(priced.basePrice || 0),
    modifiers: Number(priced.modifiers || 0),
    fees: Number(priced.fees || 0),
    tax: Number(priced.tax || 0),
    discountAmount: priced.discountAmount ? Number(priced.discountAmount) : null,
    discountReason: priced.discountReason || null,
    totalPrice: Number(priced.totalPrice || 0),
    currency: priced.currency || "USD",
    serviceType: priced.serviceType || null,
    pricingReferenceId: priced.pricingReferenceId || null,
    lockedAt: priced.priceLockedAt.toISOString(),
    lockedBy: priced.discountApprovedBy || "system",
  };
}

/**
 * Check if job status allows pricing lock
 * Typically locks when job moves to CONFIRMED or ASSIGNED
 */
export function shouldLockPricing(status: JobStatus): boolean {
  return status === "CONFIRMED" || status === "ASSIGNED";
}











