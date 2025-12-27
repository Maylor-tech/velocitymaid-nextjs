export const dynamic = 'force-dynamic';

/**
 * Admin Jobs List API
 * GET /api/admin/jobs/list
 * 
 * Returns jobs with filters:
 * - branchId: Filter by branch
 * - status: Filter by status (pending, assigned, in_progress, completed, cancelled)
 * - cleanerId: Filter by specific cleaner
 * - unassignedOnly: Filter for unassigned jobs only (true/false)
 * - search: Search in customerName, address, serviceLocation
 * - dateFrom: Filter jobs from this date (ISO string)
 * - dateTo: Filter jobs to this date (ISO string)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check

    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const cleanerId = searchParams.get('cleanerId');
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';
    const search = searchParams.get('search') || '';

    // Parse dates
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;

    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;

    // Build where clause
    const where: any = {};

    if (branchId && branchId !== 'all') {
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

    const jobs = await prisma.job.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            state: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            preferSameCleaner: true,
          },
        },
        assignedCleaner: {
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

    // Format jobs for response (map Prisma relations to camelCase for UI)
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      sessionId: job.sessionId,
      branchId: job.branchId,
      branch: job.branch,
      customerId: job.customerId,
      customer: job.customer,
      customerName: job.customerName,
      assignedCleanerId: job.assignedCleanerId,
      assignedCleaner: job.assignedCleaner,
      preferredDate: job.preferredDate?.toISOString() || null,
      preferredTime: job.preferredTime,
      serviceType: job.serviceType,
      serviceLocation: job.serviceLocation,
      address: job.address,
      status: job.status,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      currency: job.currency,
      paymentMethod: job.paymentMethod,
      paymentStatus: job.paymentStatus, // Phase 1: Include payment status
      createdAt: job.createdAt.toISOString(),
      assignedAt: job.assignedAt?.toISOString() || null,
      onTheWayAt: job.onTheWayAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      jobQualityScore: job.jobQualityScore,
      appliedReferralCode: job.appliedReferralCode,
      promoApplied: job.promoApplied,
      promoDiscount: job.promoDiscount ? Number(job.promoDiscount) : null,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (err: any) {
    console.error('ADMIN_JOBS_FETCH_ERROR:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch jobs',
      },
      { status: 500 }
    );
  }
}
