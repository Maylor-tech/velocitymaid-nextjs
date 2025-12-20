export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';
import {
  calculateJobCosts,
  type JobFinancialInput,
  getCleanerSharePercent,
} from '@/lib/financial/model';
import {
  aggregateBranchFinancials,
  aggregateCleanerEarnings,
  cleanerEarningsToArray,
} from '@/lib/financial/aggregation';
import { calculateCleanerLevel, type CleanerLevelMetrics } from '@/lib/cleaner-level';

/**
 * Helper to get cleaner level for a cleaner
 */
async function getCleanerLevel(cleanerId: string): Promise<1 | 2 | 3 | 4 | null> {
  try {
    // Get cleaner's first job date
    const firstJob = await prisma.job.findFirst({
      where: {
        assignedCleanerId: cleanerId,
        status: 'completed',
      },
      orderBy: {
        completedAt: 'asc',
      },
      select: {
        completedAt: true,
      },
    });

    if (!firstJob || !firstJob.completedAt) {
      return null;
    }

    const daysSinceFirstJob = Math.floor(
      (Date.now() - firstJob.completedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get cleaner stats
    const totalJobs = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
      },
    });

    const completedJobs = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        status: 'completed',
      },
    });

    // Get average rating
    const ratings = await prisma.cleanerRating.findMany({
      where: {
        cleanerId,
      },
      select: {
        rating: true,
      },
    });

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

    // Get complaints count (if Complaint model exists, query it; otherwise 0)
    const complaintsCount = 0; // TODO: Query Complaint model if it exists

    const metrics: CleanerLevelMetrics = {
      daysSinceFirstJob,
      totalJobs,
      completedJobs,
      averageRating,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      productivityScore: 0, // Would need to calculate this
      complaintsCount,
    };

    const levelResult = calculateCleanerLevel(metrics);
    return levelResult.level;
  } catch (error) {
    console.error('Error calculating cleaner level:', error);
    return null;
  }
}

/**
 * Check if job has unresolved complaint
 */
async function hasUnresolvedComplaint(jobId: string): Promise<boolean> {
  // TODO: Query Complaint model if it exists
  // For now, return false
  return false;
}

/**
 * POST /api/admin/payouts/preview
 * 
 * Returns payout preview for a date range using the financial engine
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body = await request.json();
    const { branchId: branchIdParam, status, dateFrom, dateTo } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: 'dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

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
        { success: false, error: 'No active branch found' },
        { status: 404 }
      );
    }

    // Determine eligible job statuses
    const eligibleStatuses =
      status === 'CompletedOnly'
        ? ['completed']
        : ['completed']; // Default to completed only for now

    // Query jobs in date range
    const jobs = await prisma.job.findMany({
      where: {
        branchId: branch.id,
        status: {
          in: eligibleStatuses,
        },
        completedAt: {
          gte: fromDate,
          lte: toDate,
        },
        assignedCleanerId: {
          not: null,
        },
      },
      include: {
        CleanerRating: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Convert jobs to financial inputs and calculate breakdowns
    const breakdowns = await Promise.all(
      jobs.map(async (job) => {
        // Get cleaner level
        const cleanerLevel = job.assignedCleanerId
          ? await getCleanerLevel(job.assignedCleanerId)
          : null;

        // Get rating
        const rating = job.CleanerRating?.rating || null;

        // Check for unresolved complaint
        const hasComplaint = await hasUnresolvedComplaint(job.id);

        // Calculate scheduled start (use preferredDate + preferredTime if available)
        const scheduledStart = job.preferredDate || null;

        // Calculate started at (use onTheWayAt or assignedAt as proxy)
        const startedAt = job.onTheWayAt || job.assignedAt || null;

        const input: JobFinancialInput = {
          jobId: job.id,
          branchId: job.branchId,
          cleanerId: job.assignedCleanerId,
          totalPrice: job.totalPrice ? Number(job.totalPrice) : 0,
          completedAt: job.completedAt,
          scheduledStart,
          startedAt,
          distanceMiles: null, // Job model doesn't have distanceMiles field
          rating: rating ? Number(rating) : null,
          hasUnresolvedComplaint: hasComplaint,
          status: job.status,
          cleanerLevel: cleanerLevel || null,
        };

        return calculateJobCosts(input);
      })
    );

    // Aggregate by branch
    const branchTotals = aggregateBranchFinancials(breakdowns);

    // Aggregate by cleaner
    const cleanerEarningsMap = aggregateCleanerEarnings(breakdowns);
    const cleanerEarningsArray = cleanerEarningsToArray(cleanerEarningsMap);

    // Get cleaner details and build response
    const cleanerIds = Array.from(cleanerEarningsMap.keys());
    const cleaners = await prisma.user.findMany({
      where: {
        id: { in: cleanerIds },
        role: 'CLEANER',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const cleanerMap = new Map(cleaners.map((c) => [c.id, c]));

    // Get cleaner levels for all cleaners (optimize by doing it once)
    const cleanerLevelsMap = new Map<string, 1 | 2 | 3 | 4 | null>();
    for (const cleanerId of cleanerIds) {
      cleanerLevelsMap.set(cleanerId, await getCleanerLevel(cleanerId));
    }

    const cleanersResponse = cleanerEarningsArray.map((earnings) => {
      const cleaner = cleanerMap.get(earnings.cleanerId);
      const level = cleanerLevelsMap.get(earnings.cleanerId);

      // Calculate gross revenue from breakdowns for this cleaner
      const cleanerBreakdowns = breakdowns.filter((b) => b.cleanerId === earnings.cleanerId);
      const grossRevenue = cleanerBreakdowns.reduce((sum, b) => sum + b.grossRevenue, 0);

      return {
        cleanerId: earnings.cleanerId,
        cleanerName: cleaner?.name || 'Unknown',
        level: level || null,
        jobsCompleted: earnings.jobsCompleted,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        cleanerEarnings: earnings.earnings,
        bonuses: earnings.bonuses,
        penalties: earnings.penalties,
        branchProfitContribution: earnings.profitContribution,
      };
    });

    return NextResponse.json({
      success: true,
      branchId: branch.id,
      dateFrom: fromDate.toISOString(),
      dateTo: toDate.toISOString(),
      totals: {
        totalGrossRevenue: branchTotals.totalGrossRevenue,
        totalStripeFees: branchTotals.totalStripeFees,
        totalSuppliesCost: branchTotals.totalSuppliesCost,
        totalTravelCost: branchTotals.totalTravelCost,
        totalOverheadCost: branchTotals.totalOverheadCost,
        totalCleanerEarnings: branchTotals.totalCleanerEarnings,
        totalBranchProfit: branchTotals.totalBranchProfit,
        branchMargin: branchTotals.branchMargin,
        totalJobs: branchTotals.totalJobs,
      },
      cleaners: cleanersResponse,
    });
  } catch (error: any) {
    console.error('Payout preview error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate payout preview',
      },
      { status: 500 }
    );
  }
}
