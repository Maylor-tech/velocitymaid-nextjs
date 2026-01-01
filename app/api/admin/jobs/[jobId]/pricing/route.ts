/**
 * Phase L: Admin Pricing Management
 * 
 * PATCH /api/admin/jobs/[jobId]/pricing
 * 
 * Admin-only endpoint to update job pricing.
 * Requires confirmation and logs all changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminPricingAccess, requirePriceUnlocked } from "@/lib/middleware/pricingGuard";
import { applyDiscount, DISCOUNT_REASON_CODES } from "@/lib/pricing/discount";
import { lockJobPricing, createPricingSnapshot, isPriceLocked, shouldLockPricing } from "@/lib/pricing/lock";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Require admin pricing access
    const auth = await requireAdminPricingAccess(request);
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      totalPrice, 
      discount, 
      lockPricing, 
      confirmChange 
    } = body;

    // Require confirmation for pricing changes
    if (!confirmChange) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Confirmation required. Set confirmChange: true to proceed.",
          requiresConfirmation: true 
        },
        { status: 400 }
      );
    }

    // Get current job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        basePrice: true,
        modifiers: true,
        fees: true,
        tax: true,
        discountAmount: true,
        discountReason: true,
        priceLockedAt: true,
        currency: true,
        serviceType: true,
        pricingReferenceId: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if pricing is locked
    if (isPriceLocked(job as any)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Job pricing is locked. To change pricing, void this job and create a new booking." 
        },
        { status: 403 }
      );
    }

    const updates: any = {};
    let discountResult = null;

    // Apply discount if provided
    if (discount) {
      const basePrice = Number(job.basePrice || job.totalPrice || 0);
      discountResult = applyDiscount(
        basePrice,
        {
          amount: discount.amount,
          reason: discount.reason,
          percentage: discount.percentage,
          maxPercentage: discount.maxPercentage || 10, // Default 10% cap
        },
        auth.role as any,
        auth.userId
      );

      if (!discountResult.success) {
        return NextResponse.json(
          { success: false, error: discountResult.error },
          { status: 400 }
        );
      }

      updates.discountAmount = discountResult.discountAmount;
      updates.discountReason = discountResult.reason;
      updates.discountApprovedBy = auth.userId;
      updates.totalPrice = discountResult.finalPrice;
    }

    // Update total price if provided (and no discount)
    if (totalPrice !== undefined && !discount) {
      updates.totalPrice = totalPrice;
    }

    // Update base price components if provided
    if (body.basePrice !== undefined) updates.basePrice = body.basePrice;
    if (body.modifiers !== undefined) updates.modifiers = body.modifiers;
    if (body.fees !== undefined) updates.fees = body.fees;
    if (body.tax !== undefined) updates.tax = body.tax;

    // Lock pricing if requested or if job status requires it
    if (lockPricing || shouldLockPricing(job.status as JobStatus)) {
      const snapshot = createPricingSnapshot(
        { ...job, ...updates } as any,
        auth.userId
      );
      await lockJobPricing(jobId, auth.userId, snapshot);
      updates.priceLockedAt = new Date();
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updates,
      select: {
        id: true,
        totalPrice: true,
        basePrice: true,
        modifiers: true,
        fees: true,
        tax: true,
        discountAmount: true,
        discountReason: true,
        priceLockedAt: true,
        currency: true,
      },
    });

    // Log price change in audit log
    await prisma.auditLog.create({
      data: {
        entityType: "Job",
        entityId: jobId,
        action: "PRICING_UPDATED",
        actorRole: "ADMIN",
        actorId: auth.userId,
        description: `Pricing updated by admin${discountResult ? ` with ${discountResult.discountAmount} discount` : ""}`,
        changes: {
          previousPrice: Number(job.totalPrice || 0),
          newPrice: Number(updatedJob.totalPrice || 0),
          discountAmount: discountResult?.discountAmount || null,
          discountReason: discountResult?.reason || null,
          priceLocked: !!updatedJob.priceLockedAt,
        },
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: updatedJob.id,
        totalPrice: Number(updatedJob.totalPrice || 0),
        basePrice: Number(updatedJob.basePrice || 0),
        modifiers: Number(updatedJob.modifiers || 0),
        fees: Number(updatedJob.fees || 0),
        tax: Number(updatedJob.tax || 0),
        discountAmount: updatedJob.discountAmount ? Number(updatedJob.discountAmount) : null,
        discountReason: updatedJob.discountReason,
        priceLockedAt: updatedJob.priceLockedAt?.toISOString() || null,
        currency: updatedJob.currency,
      },
      discount: discountResult ? {
        amount: discountResult.discountAmount,
        reason: discountResult.reason,
        capped: discountResult.error?.includes("capped") || false,
      } : null,
      message: "Pricing updated successfully",
    });
  } catch (error: any) {
    // If it's a NextResponse (from middleware), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[ADMIN_PRICING_UPDATE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update pricing",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/jobs/[jobId]/pricing
 * 
 * Get pricing information for a job (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireAdminPricingAccess(request);
    const { jobId } = params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        totalPrice: true,
        basePrice: true,
        modifiers: true,
        fees: true,
        tax: true,
        discountAmount: true,
        discountReason: true,
        discountApprovedBy: true,
        priceLockedAt: true,
        pricingSnapshot: true,
        pricingReferenceId: true,
        currency: true,
        serviceType: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pricing: {
        totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
        basePrice: job.basePrice ? Number(job.basePrice) : null,
        modifiers: job.modifiers ? Number(job.modifiers) : null,
        fees: job.fees ? Number(job.fees) : null,
        tax: job.tax ? Number(job.tax) : null,
        discountAmount: job.discountAmount ? Number(job.discountAmount) : null,
        discountReason: job.discountReason,
        discountApprovedBy: job.discountApprovedBy,
        priceLockedAt: job.priceLockedAt?.toISOString() || null,
        pricingSnapshot: job.pricingSnapshot,
        pricingReferenceId: job.pricingReferenceId,
        currency: job.currency,
        serviceType: job.serviceType,
        isLocked: !!job.priceLockedAt,
      },
      discountReasonCodes: DISCOUNT_REASON_CODES,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[ADMIN_PRICING_GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch pricing",
      },
      { status: 500 }
    );
  }
}













