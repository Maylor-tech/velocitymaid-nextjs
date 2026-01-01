export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';
import { calculateRevenueTrendSlope } from '@/lib/finance/healthScore';
import {
  calculateFinancialBreakdownsForJobs,
  calculateFinancialHealthScore,
} from '@/lib/financial/helpers';
import { aggregateBranchFinancials } from '@/lib/financial/aggregation';

/**
 * Helper functions for date operations
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate date range from query params
 */
function getDateRange(range: string, from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  let fromDate: Date;
  let toDate: Date = endOfDay(now);

  if (range === 'custom' && from && to) {
    fromDate = startOfDay(new Date(from));
    toDate = endOfDay(new Date(to));
  } else if (range === 'today') {
    fromDate = startOfDay(now);
    toDate = endOfDay(now);
  } else if (range === '7d') {
    fromDate = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    toDate = endOfDay(now);
  } else if (range === '30d') {
    fromDate = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    toDate = endOfDay(now);
  } else if (range === '90d') {
    fromDate = startOfDay(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
    toDate = endOfDay(now);
  } else {
    // Default to 30d
    fromDate = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    toDate = endOfDay(now);
  }

  return { from: fromDate, to: toDate };
}

/**
 * GET /api/admin/finance/overview
 * 
 * Returns comprehensive finance overview for a branch
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get('branchId');
    const range = searchParams.get('range') || '30d';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    // Find branch
    let branch;
    if (branchIdParam) {
      branch = await prisma.branch.findUnique({
        where: { id: branchIdParam },
      });
    }

    if (!branch) {
      // Try "new-jersey" branch
      branch = await prisma.branch.findFirst({
        where: {
          slug: 'new-jersey',
          status: 'ACTIVE',
        },
      });
    }

    if (!branch) {
      // Fallback to first ACTIVE branch
      branch = await prisma.branch.findFirst({
        where: {
          status: 'ACTIVE',
        },
      });
    }

    if (!branch) {
      return NextResponse.json(
        { error: 'No active branch found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const dateRange = getDateRange(range, from, to);

    // Calculate financial breakdowns using the financial engine
    const breakdowns = await calculateFinancialBreakdownsForJobs(branch.id, dateRange);

    // Aggregate branch financials
    const branchTotals = aggregateBranchFinancials(breakdowns);

    // Get cancelled jobs in range
    const cancelledJobs = await prisma.job.count({
      where: {
        branchId: branch.id,
        status: 'cancelled',
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
    });

    // Calculate revenue KPIs from breakdowns
    const revenueTotal = branchTotals.totalGrossRevenue;
    const jobsCompleted = branchTotals.totalJobs;
    const jobsCancelled = cancelledJobs;
    const averageTicket = jobsCompleted > 0 ? revenueTotal / jobsCompleted : 0;

    // Get active cleaners who worked in this range
    const activeCleanerIds = new Set(
      breakdowns.map((b) => b.cleanerId).filter((id): id is string => id !== null)
    );
    const activeCleanersCount = activeCleanerIds.size;
    const revenuePerCleaner = activeCleanersCount > 0 ? revenueTotal / activeCleanersCount : null;

    // Use financial engine results
    const profit = branchTotals.totalBranchProfit;
    const profitMargin = branchTotals.branchMargin;

    // Calculate trends (daily revenue and jobs) from breakdowns
    const revenueByDayMap = new Map<string, number>();
    const jobsByDayMap = new Map<string, number>();

    breakdowns.forEach((breakdown) => {
      // Find the job to get completedAt
      const job = breakdowns.find((b) => b.jobId === breakdown.jobId);
      if (job) {
        // We need to get the actual job date - for now use a placeholder
        // In production, we'd need to query jobs or store dates in breakdown
      }
    });

    // Get jobs for date mapping
    const jobsForDates = await prisma.job.findMany({
      where: {
        branchId: branch.id,
        status: 'completed',
        completedAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      select: {
        id: true,
        totalPrice: true,
        completedAt: true,
      },
    });

    jobsForDates.forEach((job) => {
      if (job.completedAt) {
        const dateKey = formatDate(job.completedAt);
        const breakdown = breakdowns.find((b) => b.jobId === job.id);
        const revenue = breakdown ? breakdown.grossRevenue : (job.totalPrice ? Number(job.totalPrice) : 0);
        const currentRevenue = revenueByDayMap.get(dateKey) || 0;
        const currentJobs = jobsByDayMap.get(dateKey) || 0;
        revenueByDayMap.set(dateKey, currentRevenue + revenue);
        jobsByDayMap.set(dateKey, currentJobs + 1);
      }
    });

    // Fill in all days in range
    const revenueByDay: Array<{ date: string; revenue: number }> = [];
    const jobsByDay: Array<{ date: string; jobs: number }> = [];
    const currentDate = new Date(dateRange.from);
    while (currentDate <= dateRange.to) {
      const dateKey = formatDate(currentDate);
      revenueByDay.push({
        date: dateKey,
        revenue: revenueByDayMap.get(dateKey) || 0,
      });
      jobsByDay.push({
        date: dateKey,
        jobs: jobsByDayMap.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate revenue trend slope
    const revenueTrendSlope = calculateRevenueTrendSlope(revenueByDay);

    // By service type - get jobs with service types
    const jobsWithServiceType = await prisma.job.findMany({
      where: {
        branchId: branch.id,
        status: 'completed',
        completedAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      select: {
        id: true,
        serviceType: true,
      },
    });

    const byServiceTypeMap = new Map<string, { jobs: number; revenue: number }>();
    jobsWithServiceType.forEach((job) => {
      const serviceType = job.serviceType || 'unknown';
      const breakdown = breakdowns.find((b) => b.jobId === job.id);
      const revenue = breakdown ? breakdown.grossRevenue : 0;
      const current = byServiceTypeMap.get(serviceType) || { jobs: 0, revenue: 0 };
      byServiceTypeMap.set(serviceType, {
        jobs: current.jobs + 1,
        revenue: current.revenue + revenue,
      });
    });

    const byServiceType = Array.from(byServiceTypeMap.entries()).map(([label, data]) => ({
      label,
      jobs: data.jobs,
      revenue: data.revenue,
    }));

    // Branches summary (all active branches) - use financial engine
    const allBranches = await prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    const branchesSummary = await Promise.all(
      allBranches.map(async (b) => {
        const branchBreakdowns = await calculateFinancialBreakdownsForJobs(b.id, dateRange);
        const branchTotals = aggregateBranchFinancials(branchBreakdowns);

        return {
          branchId: b.id,
          name: b.name,
          revenue: branchTotals.totalGrossRevenue,
          profit: branchTotals.totalBranchProfit,
        };
      })
    );

    // Calculate financial health score
    const complaintRate = 0; // TODO: Query Complaint model if it exists
    const health = calculateFinancialHealthScore(
      profitMargin,
      jobsCompleted,
      complaintRate,
      revenuePerCleaner || 0
    );

    return NextResponse.json({
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug || '',
      },
      range: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
      kpis: {
        revenueTotal: Math.round(revenueTotal * 100) / 100,
        jobsCompleted,
        jobsCancelled,
        averageTicket: Math.round(averageTicket * 100) / 100,
        revenuePerJob: Math.round(averageTicket * 100) / 100,
        revenuePerCleaner: revenuePerCleaner ? Math.round(revenuePerCleaner * 100) / 100 : null,
        laborCost: branchTotals.totalCleanerEarnings, // Cleaner earnings as labor cost
        suppliesCost: branchTotals.totalSuppliesCost,
        otherCost: branchTotals.totalOverheadCost + branchTotals.totalStripeFees,
        totalCost: branchTotals.totalStripeFees + branchTotals.totalSuppliesCost + branchTotals.totalTravelCost + branchTotals.totalOverheadCost + branchTotals.totalCleanerEarnings,
        profit: Math.round(profit * 100) / 100,
        profitMargin: Math.round(profitMargin * 10000) / 100, // As percentage
      },
      trends: {
        revenueByDay,
        jobsByDay,
      },
      byServiceType,
      branchesSummary,
      health,
    });
  } catch (error: any) {
    console.error('Finance overview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch finance overview' },
      { status: 500 }
    );
  }
}

