/**
 * Phase L: Admin Pricing Management
 *
 * PATCH /api/admin/jobs/[jobId]/pricing
 *
 * Admin-only endpoint to update job pricing.
 * Requires confirmation and logs all changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPricingAccess } from '@/lib/middleware/pricingGuard';
import { applyDiscount, DISCOUNT_REASON_CODES } from '@/lib/pricing/discount';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { UserRole } from '@prisma/client';
import {
  JOB_PRICING_SELECT,
  jobToAdminPricingView,
} from '@/lib/billing/jobPricingView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function discountRole(role: string): UserRole {
  if (role === UserRole.SUPPORT) return UserRole.SUPPORT;
  if (role === UserRole.MANAGER) return UserRole.MANAGER;
  return UserRole.ADMIN;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireAdminPricingAccess(request);
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { totalPrice, discount, confirmChange } = body;

    if (!confirmChange) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required. Set confirmChange: true to proceed.',
          requiresConfirmation: true,
        },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: JOB_PRICING_SELECT,
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const updates: {
      totalPrice?: number;
      promoDiscount?: number;
      promoApplied?: string;
    } = {};
    let discountResult: ReturnType<typeof applyDiscount> | null = null;

    if (discount) {
      const view = jobToAdminPricingView(job);
      const basePrice = view.basePrice || view.totalPrice || 0;
      discountResult = applyDiscount(
        basePrice,
        {
          amount: discount.amount,
          reason: discount.reason,
          percentage: discount.percentage,
          maxPercentage: discount.maxPercentage || 10,
        },
        discountRole(auth.role),
        auth.userId
      );

      if (!discountResult.success) {
        return NextResponse.json(
          { success: false, error: discountResult.error },
          { status: 400 }
        );
      }

      updates.promoDiscount = discountResult.discountAmount;
      updates.promoApplied = discountResult.reason;
      updates.totalPrice = discountResult.finalPrice;
    }

    if (totalPrice !== undefined && !discount) {
      updates.totalPrice = totalPrice;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updates,
      select: JOB_PRICING_SELECT,
    });

    const pricing = jobToAdminPricingView(updatedJob);

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: 'ADMIN',
      action: 'PRICING_UPDATED',
      entityType: 'Job',
      entityId: jobId,
      description: `Pricing updated by admin${discountResult ? ` with ${discountResult.discountAmount} discount` : ''}`,
      changes: {
        previousPrice: Number(job.totalPrice || 0),
        newPrice: Number(updatedJob.totalPrice || 0),
        discountAmount: discountResult?.discountAmount ?? null,
        discountReason: discountResult?.reason ?? null,
        priceLocked: false,
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: pricing.id,
        totalPrice: pricing.totalPrice ?? 0,
        basePrice: pricing.basePrice ?? 0,
        modifiers: pricing.modifiers ?? 0,
        fees: pricing.fees ?? 0,
        tax: pricing.tax ?? 0,
        discountAmount: pricing.discountAmount,
        discountReason: pricing.discountReason,
        priceLockedAt: pricing.priceLockedAt,
        currency: pricing.currency,
      },
      discount: discountResult
        ? {
            amount: discountResult.discountAmount,
            reason: discountResult.reason,
            capped: discountResult.error?.includes('capped') || false,
          }
        : null,
      message: 'Pricing updated successfully',
    });
  } catch (error: unknown) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('[ADMIN_PRICING_UPDATE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update pricing',
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
      select: JOB_PRICING_SELECT,
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pricing: jobToAdminPricingView(job),
      discountReasonCodes: DISCOUNT_REASON_CODES,
    });
  } catch (error: unknown) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('[ADMIN_PRICING_GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pricing',
      },
      { status: 500 }
    );
  }
}
