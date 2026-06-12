export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * Get Single Job API
 * GET /api/admin/jobs/[jobId]
 * 
 * Returns detailed information about a single job
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { computePayoutEligibility } from '@/lib/booking/payoutEligibility';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");

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
        paymentStatus: true,
        reviewStatus: true,
        quotedTotal: true,
        depositAmount: true,
        amountPaid: true,
        balanceDue: true,
        depositPaidAt: true,
        balancePaidAt: true,
        createdAt: true,
        assignedAt: true,
        onTheWayAt: true,
        completedAt: true,
        jobQualityScore: true,
        appliedReferralCode: true,
        promoApplied: true,
        promoDiscount: true,
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
            cleanerId: true,
            grossAmount: true,
            cleanerAmount: true,
            platformFee: true,
            currency: true,
            status: true,
            rulesVersion: true,
            paidAt: true,
            executionMethod: true,
            externalReferenceId: true,
            policyEvalDetails: true,
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

    if (auth.branchId && job.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const formattedPayout = job.JobPayout
      ? {
          id: job.JobPayout.id,
          cleanerId: job.JobPayout.cleanerId,
          grossAmount:
            job.JobPayout.grossAmount != null ? Number(job.JobPayout.grossAmount) : null,
          cleanerAmount:
            job.JobPayout.cleanerAmount != null
              ? Number(job.JobPayout.cleanerAmount)
              : null,
          platformFee:
            job.JobPayout.platformFee != null ? Number(job.JobPayout.platformFee) : null,
          currency: job.JobPayout.currency,
          status: job.JobPayout.status,
          rulesVersion: job.JobPayout.rulesVersion,
          paidAt: job.JobPayout.paidAt?.toISOString() || null,
          executionMethod: job.JobPayout.executionMethod,
          externalReferenceId: job.JobPayout.externalReferenceId,
          policyEvalDetails: job.JobPayout.policyEvalDetails,
        }
      : null;

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
      paymentStatus: job.paymentStatus,
      reviewStatus: job.reviewStatus,
      quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : null,
      depositAmount: job.depositAmount ? Number(job.depositAmount) : null,
      amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
      balanceDue: job.balanceDue ? Number(job.balanceDue) : null,
      depositPaidAt: job.depositPaidAt?.toISOString() || null,
      balancePaidAt: job.balancePaidAt?.toISOString() || null,
      branch: job.Branch,
      customer: job.Customer,
      assignedCleaner: job.User,
      createdAt: job.createdAt.toISOString(),
      assignedAt: job.assignedAt?.toISOString() || null,
      onTheWayAt: job.onTheWayAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      jobQualityScore: job.jobQualityScore,
      appliedReferralCode: job.appliedReferralCode,
      promoApplied: job.promoApplied,
      promoDiscount: job.promoDiscount ? Number(job.promoDiscount) : null,
      JobPayout: formattedPayout,
      payoutEligibility: computePayoutEligibility({
        status: job.status,
        paymentStatus: job.paymentStatus,
        assignedCleanerId: job.assignedCleanerId,
        JobPayout: formattedPayout,
      }),
    };

    return NextResponse.json({
      success: true,
      job: formattedJob,
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
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

