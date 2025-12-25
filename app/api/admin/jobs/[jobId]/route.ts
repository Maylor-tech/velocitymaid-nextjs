export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * Get Single Job API
 * GET /api/admin/jobs/[jobId]
 * 
 * Returns detailed information about a single job
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireRole } from '../../../../../lib/auth/requireRole';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'jobId is required',
        },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        sessionId: true,
        branchId: true,
        customerId: true,
        customerName: true,
        assignedCleanerId: true,
        preferredDate: true,
        preferredTime: true,
        serviceType: true,
        serviceLocation: true,
        address: true,
        status: true,
        totalPrice: true,
        currency: true,
        paymentMethod: true,
        createdAt: true,
        assignedAt: true,
        onTheWayAt: true,
        completedAt: true,
        ratingStatus: true,
        payoutStatus: true,
        jobQualityScore: true,
        appliedReferralCode: true,
        promoApplied: true,
        promoDiscount: true,
        // Phase L: Pricing lock fields
        priceLockedAt: true,
        basePrice: true,
        modifiers: true,
        fees: true,
        tax: true,
        discountAmount: true,
        discountReason: true,
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            state: true,
            city: true,
          },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            preferSameCleaner: true,
          },
        },
        User: {
          // assigned cleaner
          select: {
            id: true,
            name: true,
            email: true,
            primaryBranchId: true,
            isActive: true,
            role: true,
          },
        },
        JobPayout: {
          select: {
            id: true,
            grossAmount: true,
            cleanerAmount: true,
            platformFee: true,
            currency: true,
            status: true,
            rulesVersion: true,
            paidAt: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    // Format job for response
    const formattedJob = {
      id: job.id,
      sessionId: job.sessionId,
      branchId: job.branchId,
      Branch: job.Branch
        ? {
            id: job.Branch.id,
            name: job.Branch.name,
            slug: job.Branch.slug,
          }
        : null,
      customerId: job.customerId,
      Customer: job.Customer,
      customerName: job.customerName,
      assignedCleanerId: job.assignedCleanerId,
      User: job.User,
      preferredDate: job.preferredDate?.toISOString() || null,
      preferredTime: job.preferredTime,
      serviceType: job.serviceType,
      serviceLocation: job.serviceLocation,
      address: job.address,
      status: job.status,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      currency: job.currency,
      paymentMethod: job.paymentMethod,
      // Phase L: Pricing lock fields
      priceLockedAt: job.priceLockedAt?.toISOString() || null,
      basePrice: job.basePrice ? Number(job.basePrice) : null,
      modifiers: job.modifiers ? Number(job.modifiers) : null,
      fees: job.fees ? Number(job.fees) : null,
      tax: job.tax ? Number(job.tax) : null,
      discountAmount: job.discountAmount ? Number(job.discountAmount) : null,
      discountReason: job.discountReason,
      createdAt: job.createdAt.toISOString(),
      assignedAt: job.assignedAt?.toISOString() || null,
      onTheWayAt: job.onTheWayAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      ratingStatus: job.ratingStatus,
      payoutStatus: job.payoutStatus,
      jobQualityScore: job.jobQualityScore,
      appliedReferralCode: job.appliedReferralCode,
      promoApplied: job.promoApplied,
      promoDiscount: job.promoDiscount ? Number(job.promoDiscount) : null,
      JobPayout: job.JobPayout ? job.JobPayout.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
      })) : [],
    };

    return NextResponse.json({
      success: true,
      job: formattedJob,
    });
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch job details',
      },
      { status: 500 }
    );
  }
}

