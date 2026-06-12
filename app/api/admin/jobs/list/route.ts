export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * Admin Jobs List API
 * GET /api/admin/jobs/list
 *
 * Returns jobs with filters (branch, status, payment, unassignedOnly, search, dateFrom, dateTo).
 * Uses explicit select only on existing Job columns — never checkoutSessionId (DB has sessionId only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const cleanerId = searchParams.get('cleanerId');
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';
    const search = searchParams.get('search') || '';

    // Branch scope: branch-scoped admins see only their branch; client branchId allowed only when it matches
    const branchIdParam = searchParams.get('branchId');
    const branchId = auth.branchId ?? (branchIdParam && branchIdParam !== 'all' ? branchIdParam : undefined);

    // Parse dates
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;

    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;

    // Build where clause
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (cleanerId) {
      where.assignedCleanerId = cleanerId;
    } else if (unassignedOnly) {
      where.assignedCleanerId = null;
    }

    if (dateFrom || dateTo) {
      where.preferredDate = {};
      if (dateFrom) {
        dateFrom.setHours(0, 0, 0, 0);
        where.preferredDate.gte = dateFrom;
      }
      if (dateTo) {
        dateTo.setHours(23, 59, 59, 999);
        where.preferredDate.lte = dateTo;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { serviceLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Explicit select so we never request columns that may not exist in DB (e.g. checkoutSessionId)
    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        sessionId: true,
        branchId: true,
        customerId: true,
        assignedCleanerId: true,
        customerName: true,
        preferredDate: true,
        preferredTime: true,
        serviceType: true,
        serviceLocation: true,
        address: true,
        totalPrice: true,
        currency: true,
        paymentMethod: true,
        jobQualityScore: true,
        appliedReferralCode: true,
        promoApplied: true,
        promoDiscount: true,
        createdAt: true,
        assignedAt: true,
        onTheWayAt: true,
        completedAt: true,
        status: true,
        paymentStatus: true,
        reviewStatus: true,
        quotedTotal: true,
        depositAmount: true,
        amountPaid: true,
        balanceDue: true,
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            state: true,
          },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            preferSameCleaner: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            primaryBranchId: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { preferredDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 200,
    });

    const jobIds = jobs.map((j) => j.id);
    const confirmations = await prisma.auditLog.findMany({
      where: {
        action: 'SCHEDULE_CONFIRMED',
        entityType: 'Job',
        entityId: { in: jobIds },
      },
      select: { entityId: true },
    });
    const confirmedSet = new Set(confirmations.map((c) => c.entityId));

    // Format jobs for response (map Prisma relations to camelCase for UI)
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      sessionId: job.sessionId,
      branchId: job.branchId,
      branch: job.Branch,
      customerId: job.customerId,
      customer: job.Customer,
      customerName: job.customerName,
      assignedCleanerId: job.assignedCleanerId,
      assignedCleaner: job.User,
      preferredDate: job.preferredDate?.toISOString() || null,
      preferredTime: job.preferredTime,
      serviceType: job.serviceType,
      serviceLocation: job.serviceLocation,
      address: job.address,
      status: job.status,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      currency: job.currency,
      paymentMethod: job.paymentMethod,
      paymentStatus: job.paymentStatus ?? 'PENDING',
      reviewStatus: job.reviewStatus ?? 'PENDING',
      quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : null,
      depositAmount: job.depositAmount ? Number(job.depositAmount) : null,
      amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
      balanceDue: job.balanceDue ? Number(job.balanceDue) : null,
      createdAt: job.createdAt.toISOString(),
      assignedAt: job.assignedAt?.toISOString() || null,
      onTheWayAt: job.onTheWayAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      jobQualityScore: job.jobQualityScore,
      appliedReferralCode: job.appliedReferralCode,
      promoApplied: job.promoApplied,
      promoDiscount: job.promoDiscount ? Number(job.promoDiscount) : null,
      scheduleConfirmed: confirmedSet.has(job.id),
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (err: unknown) {
    console.error('Admin jobs API error:', err);
    return NextResponse.json({
      success: true,
      jobs: [],
      warning: 'Jobs temporarily unavailable',
    });
  }
}
