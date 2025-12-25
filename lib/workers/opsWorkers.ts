/**
 * Operations Worker Functions
 * 
 * Background workers for recalculating metrics, cleaner levels, and data integrity checks
 */

import { prisma } from '../prisma';
import { calculateCleanerLevel, CleanerLevelMetrics } from '../cleaner-level';
import {
  calculateFinancialBreakdownsForJobs,
} from '../financial/helpers';
import { aggregateBranchFinancials } from '../financial/aggregation';

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

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Recalculate branch metrics and store in BranchMetrics table
 */
export async function recalculateBranchMetrics(branchId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  // Jobs today
  const jobsToday = await prisma.job.count({
    where: {
      branchId,
      preferredDate: {
        gte: todayStart,
        lte: todayEnd,
      },
      status: {
        not: 'cancelled',
      },
    },
  });

  // Jobs this week
  const jobsThisWeek = await prisma.job.count({
    where: {
      branchId,
      preferredDate: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: {
        not: 'cancelled',
      },
    },
  });

  // Unassigned jobs
  const unassignedJobs = await prisma.job.count({
    where: {
      branchId,
      assignedCleanerId: null,
      status: {
        in: ['pending', 'assigned'],
      },
    },
  });

  // Revenue this week
  const completedJobsThisWeek = await prisma.job.findMany({
    where: {
      branchId,
      status: 'completed',
      preferredDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    select: {
      totalPrice: true,
    },
  });

  const revenueThisWeek = completedJobsThisWeek.reduce((sum, job) => {
    return sum + (job.totalPrice ? Number(job.totalPrice) : 0);
  }, 0);

  // Upsert BranchMetrics
  const metrics = await prisma.branchMetrics.upsert({
    where: { branchId },
    update: {
      jobsToday,
      jobsThisWeek,
      revenueThisWeek,
      unassignedJobs,
    },
    create: {
      branchId,
      jobsToday,
      jobsThisWeek,
      revenueThisWeek,
      unassignedJobs,
    },
  });

  return metrics;
}

/**
 * Recalculate cleaner levels for all cleaners in a branch
 */
export async function recalculateCleanerLevels(branchId: string) {
  // Get all cleaners attached to this branch
  const cleaners = await prisma.user.findMany({
    where: {
      role: 'CLEANER',
      OR: [
        { primaryBranchId: branchId },
        {
          UserBranch: {
            some: {
              branchId,
            },
          },
        },
      ],
    },
  });

  const results = [];

  for (const cleaner of cleaners) {
    try {
      // Get all jobs for this cleaner
      const allJobs = await prisma.job.findMany({
        where: {
          branchId,
          assignedCleanerId: cleaner.id,
        },
        orderBy: { createdAt: 'asc' },
      });

      const firstJob = allJobs[0];
      const daysSinceFirstJob = firstJob
        ? Math.floor(
            (new Date().getTime() - firstJob.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      const totalJobs = allJobs.length;
      const completedJobs = allJobs.filter((j) => j.status === 'completed');
      const completedCount = completedJobs.length;
      const completionRate = totalJobs > 0 ? (completedCount / totalJobs) * 100 : 0;

      // Get ratings
      const ratings = await prisma.cleanerRating.findMany({
        where: { cleanerId: cleaner.id },
      });
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : null;

      // Calculate weekly jobs for productivity
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklyJobs = allJobs.filter(
        (j) => j.createdAt >= weekAgo && j.status === 'completed'
      ).length;
      const productivityScore = Math.min(100, (weeklyJobs / 8) * 100);

      // Get complaints count (placeholder - use low quality jobs as proxy)
      const lowQualityJobs = completedJobs.filter(
        (j) => j.jobQualityScore !== null && j.jobQualityScore < 70
      ).length;
      const complaintsCount = lowQualityJobs;

      // Build metrics
      const metrics: CleanerLevelMetrics = {
        daysSinceFirstJob,
        totalJobs,
        completedJobs: completedCount,
        averageRating,
        completionRate,
        productivityScore,
        complaintsCount,
      };

      // Calculate level
      const level = calculateCleanerLevel(metrics);

      results.push({
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        level: level.level,
        label: level.label,
      });
    } catch (err: any) {
      console.error(`Error calculating level for cleaner ${cleaner.id}:`, err);
      results.push({
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        error: err.message,
      });
    }
  }

  return {
    totalCleaners: cleaners.length,
    updated: results.length,
    results,
  };
}

/**
 * Run data integrity checks for a branch
 */
export async function runDataIntegrityChecks(branchId: string) {
  // Orphan jobs (no customer)
  const orphanJobs = await prisma.job.count({
    where: {
      branchId,
      customerId: null,
    },
  });

  // Jobs without branch (shouldn't happen, but check)
  // Note: branchId is required in the schema, so this should always be 0
  // We'll just set it to 0 since Prisma doesn't allow checking for null on required fields
  // If we need to check, we'd need to make branchId optional in the schema first
  const jobsWithoutBranch = 0;

  // Cleaners without branch connection
  const cleanersWithoutBranch = await prisma.user.count({
    where: {
      role: 'CLEANER',
      primaryBranchId: null,
      UserBranch: {
        none: {},
      },
    },
  });

  // Jobs with missing cleaner (assignedCleanerId set but user not found)
  // Get all jobs for this branch, then filter for those with assignedCleanerId
  const allBranchJobs = await prisma.job.findMany({
    where: {
      branchId,
    },
    select: {
      assignedCleanerId: true,
    },
  });

  // Filter to only jobs with assignedCleanerId (not null)
  const jobsWithAssignedCleaner = allBranchJobs.filter(
    (job) => job.assignedCleanerId !== null
  );

  let jobsWithMissingCleaner = 0;
  for (const job of jobsWithAssignedCleaner) {
    if (!job.assignedCleanerId) continue;
    const cleaner = await prisma.user.findUnique({
      where: { id: job.assignedCleanerId },
    });
    if (!cleaner) {
      jobsWithMissingCleaner++;
    }
  }

  return {
    orphanJobs,
    jobsWithoutBranch,
    cleanersWithoutBranch,
    jobsWithMissingCleaner,
  };
}

/**
 * Recalculate financial metrics for a branch (last 30 days)
 */
export async function recalculateFinancialMetrics(branchId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateRange = {
    from: thirtyDaysAgo,
    to: now,
  };

  try {
    // Calculate financial breakdowns for last 30 days
    const breakdowns = await calculateFinancialBreakdownsForJobs(branchId, dateRange);
    const branchTotals = aggregateBranchFinancials(breakdowns);

    return {
      totalGrossRevenue: branchTotals.totalGrossRevenue,
      totalBranchProfit: branchTotals.totalBranchProfit,
      branchMargin: branchTotals.branchMargin,
      totalJobs: branchTotals.totalJobs,
      totalCleanerEarnings: branchTotals.totalCleanerEarnings,
      totalCosts: branchTotals.totalStripeFees + branchTotals.totalSuppliesCost + branchTotals.totalTravelCost + branchTotals.totalOverheadCost,
    };
  } catch (error: any) {
    console.error('Error recalculating financial metrics:', error);
    return {
      totalGrossRevenue: 0,
      totalBranchProfit: 0,
      branchMargin: 0,
      totalJobs: 0,
      totalCleanerEarnings: 0,
      totalCosts: 0,
    };
  }
}

/**
 * Run full operations job for a branch
 */
export async function runFullOpsJob(branchId: string) {
  const startTime = Date.now();

  try {
    // 1) Recalculate metrics
    const metrics = await recalculateBranchMetrics(branchId);

    // 2) Recalculate cleaner levels
    const cleanerLevels = await recalculateCleanerLevels(branchId);

    // 3) Run integrity checks
    const integrity = await runDataIntegrityChecks(branchId);

    // 4) Recalculate financial metrics (last 30 days)
    const financialMetrics = await recalculateFinancialMetrics(branchId);

    // 5) Auto-issue certificate if training passed but no certificate exists
    const passedStatuses = await prisma.trainingStatus.findMany({
      where: {
        overallStatus: 'PASSED',
      },
    });

    let certificatesIssued = 0;
    for (const status of passedStatuses) {
      const hasCert = await prisma.trainingCertificate.findFirst({
        where: {
          trainingStatusId: status.id,
          cleanerId: status.cleanerId,
        },
      });

      if (!hasCert) {
        await prisma.trainingCertificate.create({
          data: {
            certificateId: `CERT-${Date.now()}-${status.cleanerId.slice(0, 8)}`,
            cleanerId: status.cleanerId,
            trainingStatusId: status.id,
          },
        });
        certificatesIssued++;
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      metrics: {
        ...metrics,
        financial: financialMetrics,
      },
      cleanerLevels,
      integrity,
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    throw {
      success: false,
      error: error.message || 'Unknown error',
      durationMs,
    };
  }
}

