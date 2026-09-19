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
import { resolveCompletionPaymentUpdate } from '@/lib/booking/jobPayment';
import { maybeCreatePayoutAfterTransition } from '@/lib/booking/maybeCreatePayoutAfterTransition';
import { logAuditEntry } from '@/lib/audit';
import type { JobStatus } from '@prisma/client';
import { awaitJobCalendarCancel, awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';
import { isDispatchOffersEnabledForBranch } from '@/lib/dispatch/featureFlags';
import { deriveDispatchUiState } from '@/lib/dispatch/dispatchState';
import { isEffectivelyOpen, effectiveOfferStatus } from '@/lib/dispatch/offerExpiry';
import { notifyCleanerOfJobCancellation } from '@/lib/notifications/cleanerCancellationEmail';
import { applyAdminTerminalCancellation } from '@/lib/admin/applyAdminTerminalCancellation';
import { isDispatchError } from '@/lib/dispatch/errors';
import type { Prisma } from '@prisma/client';

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
        JobOffer: {
          orderBy: { offeredAt: 'desc' },
          take: 8,
          select: {
            id: true,
            status: true,
            expiresAt: true,
            compensationAmount: true,
            Cleaner: { select: { name: true } },
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

    const openOfferRow = job.JobOffer.find((o) => isEffectivelyOpen(o)) ?? null;
    const terminalOfferRow = job.JobOffer.find((o) => !isEffectivelyOpen(o)) ?? null;
    const toOfferSummary = (
      row: (typeof job.JobOffer)[number] | null
    ) =>
      row
        ? {
            id: row.id,
            status: effectiveOfferStatus(row),
            cleanerName: row.Cleaner.name,
            expiresAt: row.expiresAt.toISOString(),
            compensationAmount: Number(row.compensationAmount),
          }
        : null;
    const dispatchUi = deriveDispatchUiState({
      assignedCleanerId: job.assignedCleanerId,
      assignedCleanerName: job.User?.name ?? null,
      openOffer: toOfferSummary(openOfferRow),
      latestTerminalOffer: toOfferSummary(terminalOfferRow),
    });

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
      dispatchUi,
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
        amountPaid: true,
        paymentStatus: true,
        assignedCleanerId: true,
        JobPayout: { select: { status: true } },
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
      if (body.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        const paymentUpdate = resolveCompletionPaymentUpdate(
          existing.paymentStatus,
          {
            quotedTotal:
              existing.quotedTotal != null ? Number(existing.quotedTotal) : null,
            totalPrice:
              existing.totalPrice != null ? Number(existing.totalPrice) : null,
            amountPaid:
              existing.amountPaid != null ? Number(existing.amountPaid) : null,
          },
          { payoutStatus: existing.JobPayout?.status ?? null }
        );
        if (paymentUpdate) {
          data.paymentStatus = paymentUpdate.paymentStatus;
          data.balanceDue = paymentUpdate.balanceDue;
        }
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

    const nextStatus = data.status as JobStatus | undefined;
    const becomingCancelled =
      (nextStatus === 'CANCELLED' || nextStatus === 'CANCELLED_EMERGENCY') &&
      existing.status !== nextStatus;

    if (becomingCancelled && nextStatus) {
      // Terminal cancel + assignment clear must be atomic. Do not leave an
      // orphaned assignedCleanerId / assignedAt / JobTeamMember row.
      const otherFields: Prisma.JobUncheckedUpdateManyInput = {};
      for (const [key, value] of Object.entries(data)) {
        if (key === 'status' || key === 'assignedCleanerId' || key === 'assignedAt') {
          continue;
        }
        (otherFields as Record<string, unknown>)[key] = value;
      }
      const now = new Date();
      const extraJobData: Prisma.JobUncheckedUpdateManyInput = {
        cancelledAt: now,
        ...otherFields,
      };

      const cancelResult = await applyAdminTerminalCancellation({
        jobId,
        adminId: auth.userId,
        nextStatus,
        reasonLabel: 'Admin cancelled job',
        reasonCode: 'ADMIN_CANCELLED',
        notes: null,
        extraJobData,
        unassignedUpdateData: otherFields,
      });

      const refreshed = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          preferredDate: true,
          preferredTime: true,
          internalNotes: true,
          address: true,
          serviceType: true,
          status: true,
          paymentStatus: true,
          balanceDue: true,
          totalPrice: true,
          assignedCleanerId: true,
          assignedAt: true,
        },
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
            preferredDate: refreshed?.preferredDate?.toISOString() ?? null,
            preferredTime: refreshed?.preferredTime ?? null,
            internalNotes: refreshed?.internalNotes ?? null,
            address: refreshed?.address ?? null,
            serviceType: refreshed?.serviceType ?? null,
            status: cancelResult.job.status,
            totalPrice: cancelResult.job.totalPrice,
            assignedCleanerId: cancelResult.job.assignedCleanerId,
          },
        },
      });

      await awaitJobCalendarCancel(jobId);

      if (cancelResult.releasedCleanerId) {
        await notifyCleanerOfJobCancellation({
          jobId,
          cleanerId: cancelResult.releasedCleanerId,
          triggeredBy: 'admin',
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        job: {
          id: jobId,
          preferredDate: refreshed?.preferredDate?.toISOString() ?? null,
          preferredTime: refreshed?.preferredTime ?? null,
          internalNotes: refreshed?.internalNotes ?? null,
          address: refreshed?.address ?? null,
          serviceType: refreshed?.serviceType ?? null,
          status: cancelResult.job.status,
          paymentStatus: cancelResult.job.paymentStatus,
          balanceDue:
            refreshed?.balanceDue != null ? Number(refreshed.balanceDue) : null,
          totalPrice: cancelResult.job.totalPrice,
          assignedCleanerId: cancelResult.job.assignedCleanerId,
        },
        payout: null,
      });
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

    const scheduleOrCleanerChanged =
      data.preferredDate !== undefined ||
      data.preferredTime !== undefined ||
      data.assignedCleanerId !== undefined ||
      data.serviceType !== undefined;

    if (scheduleOrCleanerChanged) {
      await awaitJobCalendarSync(jobId);
    }

    let payout: Awaited<ReturnType<typeof maybeCreatePayoutAfterTransition>> | null =
      null;
    if (updated.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      payout = await maybeCreatePayoutAfterTransition(jobId);
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
        paymentStatus: updated.paymentStatus,
        balanceDue: updated.balanceDue != null ? Number(updated.balanceDue) : null,
        totalPrice: updated.totalPrice ? Number(updated.totalPrice) : null,
        assignedCleanerId: updated.assignedCleanerId,
      },
      payout,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    if (isDispatchError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to update job';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

