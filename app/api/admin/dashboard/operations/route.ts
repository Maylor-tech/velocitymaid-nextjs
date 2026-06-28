export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard/operations
 * Aggregated KPIs for the Operations Dashboard (NJ + VT, branch-scoped when applicable).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, assertSuperAdmin } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import {
  startOfWeek,
  endOfWeek,
  addDays,
} from '@/lib/admin/dateRanges';
import { getBillingDashboardKpis } from '@/lib/billing/jobCompletionWorkflow';
import { formatUsd } from '@/lib/invoices/invoiceUtils';

function jobRevenueUsd(totalPrice: unknown, currency: string | null): number {
  if (totalPrice == null) return 0;
  const amount = Number(totalPrice);
  if (!Number.isFinite(amount)) return 0;
  if (currency === 'JMD') return amount * 0.0065;
  return amount;
}

function formatDelta(
  current: number,
  previous: number,
  suffix = 'vs last'
): { value: string; direction: 'up' | 'down' | 'flat' } | undefined {
  if (current === 0 && previous === 0) return undefined;
  if (previous === 0) {
    return current > 0
      ? { value: `New ${suffix}`, direction: 'up' }
      : undefined;
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) {
    return { value: `Flat ${suffix}`, direction: 'flat' };
  }
  return {
    value: `${Math.abs(Math.round(pct))}% ${suffix}`,
    direction: pct >= 0 ? 'up' : 'down',
  };
}

function formatRatingDelta(
  current: number | null,
  previous: number | null
): { value: string; direction: 'up' | 'down' | 'flat' } | undefined {
  if (current == null || previous == null) return undefined;
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) {
    return { value: 'Flat vs last', direction: 'flat' };
  }
  return {
    value: `${Math.abs(diff).toFixed(1)} vs last`,
    direction: diff >= 0 ? 'up' : 'down',
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    assertSuperAdmin(auth);
    const branchWhere = auth.branchId ? { branchId: auth.branchId } : {};

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const lastWeekStart = addDays(weekStart, -7);
    const lastWeekEnd = addDays(weekEnd, -7);
    const notCancelled: { notIn: JobStatus[] } = {
      notIn: [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY],
    };
    const activeStatuses: { notIn: JobStatus[] } = {
      notIn: [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY, JobStatus.COMPLETED],
    };

    const [
      jobsThisWeek,
      jobsLastWeek,
      weeklyJobs,
      lastWeekJobs,
      activeCleaners,
      onboardingCleaners,
      unassignedJobs,
      newCleanerApplications,
      ratings,
      ratingsBeforeWeek,
    ] = await Promise.all([
      prisma.job.count({
        where: {
          ...branchWhere,
          archivedAt: null,
          preferredDate: { gte: weekStart, lte: weekEnd },
          status: notCancelled,
        },
      }),
      prisma.job.count({
        where: {
          ...branchWhere,
          archivedAt: null,
          preferredDate: { gte: lastWeekStart, lte: lastWeekEnd },
          status: notCancelled,
        },
      }),
      prisma.job.findMany({
        where: {
          ...branchWhere,
          archivedAt: null,
          preferredDate: { gte: weekStart, lte: weekEnd },
          status: notCancelled,
        },
        select: { totalPrice: true, currency: true },
      }),
      prisma.job.findMany({
        where: {
          ...branchWhere,
          archivedAt: null,
          preferredDate: { gte: lastWeekStart, lte: lastWeekEnd },
          status: notCancelled,
        },
        select: { totalPrice: true, currency: true },
      }),
      prisma.user.count({
        where: {
          role: 'CLEANER',
          isActive: true,
          ...(auth.branchId ? { primaryBranchId: auth.branchId } : {}),
        },
      }),
      prisma.cleanerApplication.count({
        where: {
          ...branchWhere,
          status: { in: ['PENDING', 'NEW', 'REVIEWING'] },
        },
      }),
      prisma.job.count({
        where: {
          ...branchWhere,
          archivedAt: null,
          assignedCleanerId: null,
          status: activeStatuses,
          preferredDate: { gte: now },
        },
      }),
      prisma.cleanerApplication.count({
        where: {
          ...(auth.branchId ? { branchId: auth.branchId } : {}),
          status: 'NEW',
        },
      }),
      prisma.cleanerRating.findMany({
        where: auth.branchId
          ? { Cleaner: { primaryBranchId: auth.branchId } }
          : undefined,
        select: { rating: true, createdAt: true },
      }),
      prisma.cleanerRating.findMany({
        where: {
          createdAt: { lt: weekStart },
          ...(auth.branchId
            ? { Cleaner: { primaryBranchId: auth.branchId } }
            : {}),
        },
        select: { rating: true },
      }),
    ]);

    const revenueThisWeek = weeklyJobs.reduce(
      (sum, j) => sum + jobRevenueUsd(j.totalPrice, j.currency),
      0
    );
    const revenueLastWeek = lastWeekJobs.reduce(
      (sum, j) => sum + jobRevenueUsd(j.totalPrice, j.currency),
      0
    );

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
        : null;
    const prevAvgRating =
      ratingsBeforeWeek.length > 0
        ? ratingsBeforeWeek.reduce((s, r) => s + r.rating, 0) /
          ratingsBeforeWeek.length
        : null;

    const billing = await getBillingDashboardKpis(auth.branchId);

    return NextResponse.json({
      success: true,
      kpis: {
        jobsThisWeek,
        jobsWeekDelta: formatDelta(jobsThisWeek, jobsLastWeek),
        revenueWeek: Math.round(revenueThisWeek * 100) / 100,
        revenueWeekDelta: formatDelta(revenueThisWeek, revenueLastWeek),
        activeCleaners,
        onboardingCleaners,
        newCleanerApplications,
        avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
        ratingDelta: formatRatingDelta(avgRating, prevAvgRating),
        outstandingInvoices: billing.outstandingInvoices.count,
        outstandingBalance: billing.outstandingInvoices.total,
        outstandingBalanceFormatted: formatUsd(billing.outstandingInvoices.total),
        paymentsThisMonth: billing.paymentsThisMonth,
        paymentsThisMonthFormatted: formatUsd(billing.paymentsThisMonth),
        completionReportsPending: billing.completionReportsPending,
        reviewsRequested: billing.reviewsRequested,
      },
      unassignedJobs,
    });
  } catch (err: unknown) {
    if (err instanceof NextResponse) return err;
    console.error('OPERATIONS_DASHBOARD_ERROR:', err);
    const message = err instanceof Error ? err.message : 'Failed to load operations data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
