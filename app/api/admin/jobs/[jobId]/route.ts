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
import { logAuditEntry } from '@/lib/audit';
import type { JobStatus } from '@prisma/client';
import { awaitJobCalendarCancel, awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';
import { isDispatchOffersEnabledForBranch } from '@/lib/dispatch/featureFlags';
import { cancelOpenOffersForJob } from '@/lib/dispatch/jobOffer';

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
        billingPolicy: true,
        reviewStatus: true,
        quotedTotal: true,
        operationalTotal: true,
        processingAllowanceEstimated: true,
        pricingPolicyVersion: true,
        depositAmount: true,
        amountPaid: true,
        balanceDue: true,
        depositPaidAt: true,
        balancePaidAt: true,
        paidAt: true,
        paymentReference: true,
        createdAt: true,
        assignedAt: true,
        onTheWayAt: true,
        startedAt: true,
        completedAt: true,
        cleanDurationMins: true,
        estimatedDurationMins: true,
        dispatchUrgency: true,
        jobQualityScore: true,
        internalNotes: true,
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
        propertyId: true,
        Property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            bedrooms: true,
            bathrooms: true,
            accessType: true,
            standingInstructions: true,
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
      billingPolicy: job.billingPolicy ?? 'PREPAY',
      reviewStatus: job.reviewStatus,
      quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : null,
      operationalTotal:
        job.operationalTotal != null ? Number(job.operationalTotal) : null,
      processingAllowanceEstimated:
        job.processingAllowanceEstimated != null
          ? Number(job.processingAllowanceEstimated)
          : null,
      pricingPolicyVersion: job.pricingPolicyVersion ?? null,
      depositAmount: job.depositAmount ? Number(job.depositAmount) : null,
      amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
      balanceDue: job.balanceDue ? Number(job.balanceDue) : null,
      depositPaidAt: job.depositPaidAt?.toISOString() || null,
      balancePaidAt: job.balancePaidAt?.toISOString() || null,
      paidAt: job.paidAt?.toISOString() || null,
      paymentReference: job.paymentReference,
      branch: job.Branch,
      customer: job.Customer,
      assignedCleaner: job.User,
      createdAt: job.createdAt.toISOString(),
      assignedAt: job.assignedAt?.toISOString() || null,
      onTheWayAt: job.onTheWayAt?.toISOString() || null,
      startedAt: job.startedAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      cleanDurationMins: job.cleanDurationMins,
      estimatedDurationMins: job.estimatedDurationMins,
      dispatchUrgency: job.dispatchUrgency,
      internalNotes: job.internalNotes,
      jobQualityScore: job.jobQualityScore,
      appliedReferralCode: job.appliedReferralCode,
      promoApplied: job.promoApplied,
      promoDiscount: job.promoDiscount ? Number(job.promoDiscount) : null,
      JobPayout: formattedPayout,
      propertyId: job.propertyId,
      property: job.Property
        ? {
            id: job.Property.id,
            name: job.Property.name,
            address: job.Property.address,
            city: job.Property.city,
            state: job.Property.state,
            bedrooms: job.Property.bedrooms,
            bathrooms: job.Property.bathrooms,
            accessType: job.Property.accessType,
            standingInstructions: job.Property.standingInstructions,
          }
        : null,
      payoutEligibility: computePayoutEligibility({
        status: job.status,
        paymentStatus: job.paymentStatus,
        assignedCleanerId: job.assignedCleanerId,
        JobPayout: formattedPayout,
      }),
      dispatchOffersEnabled: isDispatchOffersEnabledForBranch(job.Branch?.slug),
    };

    return NextResponse.json({
      success: true,
      job: formattedJob,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job details',
      },
      { status: 500 }
    );
  }
}

const EDITABLE_STATUSES = new Set<string>([
  'RECEIVED',
  'CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_THE_WAY',
  'COMPLETED',
  'CANCELLED',
  'CANCELLED_EMERGENCY',
]);

/**
 * PATCH /api/admin/jobs/[jobId]
 * Admin job edit — always allowed regardless of workflow status.
 * Payment status is intentionally excluded (use Mark as Paid).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { jobId } = params;

    const existing = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        branchId: true,
        preferredDate: true,
        preferredTime: true,
        internalNotes: true,
        address: true,
        serviceType: true,
        status: true,
        totalPrice: true,
        quotedTotal: true,
        assignedCleanerId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (auth.branchId && existing.branchId !== auth.branchId) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.preferredDate !== undefined) {
      data.preferredDate = body.preferredDate ? new Date(body.preferredDate) : null;
    }
    if (body.preferredTime !== undefined) {
      data.preferredTime = body.preferredTime?.trim() || null;
    }
    if (body.internalNotes !== undefined) {
      data.internalNotes = body.internalNotes?.trim() || null;
    }
    if (body.address !== undefined) {
      data.address = body.address?.trim() || null;
    }
    if (body.serviceType !== undefined) {
      data.serviceType = body.serviceType?.trim() || null;
    }
    if (body.status !== undefined) {
      if (!EDITABLE_STATUSES.has(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid job status' }, { status: 400 });
      }
      data.status = body.status as JobStatus;
      if (body.status === 'COMPLETED' && !body.completedAt) {
        data.completedAt = new Date();
      }
    }
    if (body.totalPrice !== undefined) {
      const amount = Number(body.totalPrice);
      if (Number.isNaN(amount) || amount < 0) {
        return NextResponse.json({ success: false, error: 'Invalid total price' }, { status: 400 });
      }
      data.totalPrice = amount;
      data.quotedTotal = amount;
    }
    if (body.assignedCleanerId !== undefined) {
      if (body.assignedCleanerId) {
        const cleaner = await prisma.user.findFirst({
          where: { id: body.assignedCleanerId, role: 'CLEANER', isActive: true },
          select: { id: true },
        });
        if (!cleaner) {
          return NextResponse.json({ success: false, error: 'Cleaner not found' }, { status: 400 });
        }
      }
      data.assignedCleanerId = body.assignedCleanerId || null;
      if (body.assignedCleanerId && !existing.assignedCleanerId) {
        data.assignedAt = new Date();
      }
    }
    if (body.dispatchUrgency !== undefined) {
      const urgency = String(body.dispatchUrgency);
      if (!['STANDARD', 'SAME_DAY', 'URGENT'].includes(urgency)) {
        return NextResponse.json({ success: false, error: 'Invalid dispatch urgency' }, { status: 400 });
      }
      data.dispatchUrgency = urgency;
    }
    if (body.estimatedDurationMins !== undefined) {
      if (body.estimatedDurationMins === null || body.estimatedDurationMins === '') {
        data.estimatedDurationMins = null;
      } else {
        const mins = Number(body.estimatedDurationMins);
        if (!Number.isFinite(mins) || mins < 0) {
          return NextResponse.json({ success: false, error: 'Invalid estimated duration' }, { status: 400 });
        }
        data.estimatedDurationMins = Math.round(mins);
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data,
    });

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: auth.role,
      action: 'JOB_UPDATED',
      entityType: 'Job',
      entityId: jobId,
      description: 'Admin edited job details',
      changes: {
        before: {
          preferredDate: existing.preferredDate?.toISOString() ?? null,
          preferredTime: existing.preferredTime,
          internalNotes: existing.internalNotes,
          address: existing.address,
          serviceType: existing.serviceType,
          status: existing.status,
          totalPrice: existing.totalPrice ? Number(existing.totalPrice) : null,
          assignedCleanerId: existing.assignedCleanerId,
        },
        after: {
          preferredDate: updated.preferredDate?.toISOString() ?? null,
          preferredTime: updated.preferredTime,
          internalNotes: updated.internalNotes,
          address: updated.address,
          serviceType: updated.serviceType,
          status: updated.status,
          totalPrice: updated.totalPrice ? Number(updated.totalPrice) : null,
          assignedCleanerId: updated.assignedCleanerId,
        },
      },
    });

    const becameCancelled =
      (updated.status === 'CANCELLED' || updated.status === 'CANCELLED_EMERGENCY') &&
      existing.status !== updated.status;
    const scheduleOrCleanerChanged =
      data.preferredDate !== undefined ||
      data.preferredTime !== undefined ||
      data.assignedCleanerId !== undefined ||
      data.serviceType !== undefined;

    if (becameCancelled) {
      await cancelOpenOffersForJob(jobId, auth.userId);
      await awaitJobCalendarCancel(jobId);
    } else if (scheduleOrCleanerChanged) {
      await awaitJobCalendarSync(jobId);
    }

    return NextResponse.json({
      success: true,
      job: {
        id: updated.id,
        preferredDate: updated.preferredDate?.toISOString() ?? null,
        preferredTime: updated.preferredTime,
        internalNotes: updated.internalNotes,
        address: updated.address,
        serviceType: updated.serviceType,
        status: updated.status,
        totalPrice: updated.totalPrice ? Number(updated.totalPrice) : null,
        assignedCleanerId: updated.assignedCleanerId,
      },
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to update job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

