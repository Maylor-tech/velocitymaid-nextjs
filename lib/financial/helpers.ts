/**
 * Financial Engine - Helper Functions
 * 
 * Reusable helpers for calculating financial metrics from jobs
 */

import { prisma } from '../prisma';
import { JobStatus } from '@prisma/client';
import {
  calculateJobCosts,
  type JobFinancialInput,
} from './model';
import {
  aggregateBranchFinancials,
  aggregateCleanerEarnings,
} from './aggregation';
import { calculateCleanerLevel, type CleanerLevelMetrics } from '../cleaner-level';

/**
 * Helper to get cleaner level for a cleaner
 */
export async function getCleanerLevel(cleanerId: string): Promise<1 | 2 | 3 | 4 | null> {
  try {
    const firstJob = await prisma.job.findFirst({
      where: {
        assignedCleanerId: cleanerId,
        status: JobStatus.COMPLETED,
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

    const totalJobs = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
      },
    });

    const completedJobs = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        status: JobStatus.COMPLETED,
      },
    });

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

    const complaintsCount = 0; // TODO: Query Complaint model if it exists

    const metrics: CleanerLevelMetrics = {
      daysSinceFirstJob,
      totalJobs,
      completedJobs,
      averageRating,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      productivityScore: 0,
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
export async function hasUnresolvedComplaint(jobId: string): Promise<boolean> {
  // TODO: Query Complaint model if it exists
  return false;
}

/**
 * Calculate financial breakdowns for jobs in a date range
 */
export async function calculateFinancialBreakdownsForJobs(
  branchId: string,
  dateRange: { from: Date; to: Date }
) {
  // Query completed jobs in range
  const jobs = await prisma.job.findMany({
    where: {
      branchId,
      status: JobStatus.COMPLETED,
      completedAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
      assignedCleanerId: {
        not: null,
      },
    },
    // CleanerRating is a relation, not included here - query separately if needed
    orderBy: {
      completedAt: 'asc',
    },
  });

  // Get cleaner levels for all cleaners (optimize by batching)
  const cleanerIds = Array.from(
    new Set(jobs.map((j) => j.assignedCleanerId).filter((id): id is string => id !== null))
  );
  const cleanerLevelsMap = new Map<string, 1 | 2 | 3 | 4 | null>();
  for (const cleanerId of cleanerIds) {
    cleanerLevelsMap.set(cleanerId, await getCleanerLevel(cleanerId));
  }

  // Convert jobs to financial inputs and calculate breakdowns
  const breakdowns = await Promise.all(
    jobs.map(async (job) => {
      const cleanerLevel = job.assignedCleanerId
        ? cleanerLevelsMap.get(job.assignedCleanerId) || null
        : null;

      // Get rating separately since CleanerRating is a relation
      const ratingRecord = await prisma.cleanerRating.findUnique({
        where: { jobId: job.id },
        select: { rating: true },
      });
      const rating = ratingRecord?.rating || null;
      const hasComplaint = await hasUnresolvedComplaint(job.id);
      const scheduledStart = job.preferredDate || null;
      const startedAt = job.onTheWayAt || job.assignedAt || null;

      const input: JobFinancialInput = {
        jobId: job.id,
        branchId: job.branchId,
        cleanerId: job.assignedCleanerId,
        totalPrice: job.totalPrice ? Number(job.totalPrice) : 0,
        completedAt: job.completedAt,
        scheduledStart,
        startedAt,
        distanceMiles: null,
        rating: rating ? Number(rating) : null,
        hasUnresolvedComplaint: hasComplaint,
        status: job.status,
        cleanerLevel: cleanerLevel || null,
      };

      return calculateJobCosts(input);
    })
  );

  return breakdowns;
}

/**
 * Calculate financial health score
 */
export function calculateFinancialHealthScore(
  margin: number,
  jobsCompleted: number,
  complaintsRate: number,
  revenuePerCleaner: number
): { score: number; recommendations: string[] } {
  let score = 50;

  // Margin contribution (target ≥ 25%)
  score += margin * 100 * 0.3;

  // Jobs completed contribution
  score += Math.min(20, (jobsCompleted / 50) * 20);

  // Complaints rate penalty
  score -= complaintsRate * 100 * 0.2;

  // Revenue per cleaner contribution
  score += Math.min(10, revenuePerCleaner / 500 * 10);

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Generate recommendations
  const recommendations: string[] = [];

  if (margin < 0.25) {
    recommendations.push('Increase prices or reduce costs to improve profit margins.');
  }

  if (complaintsRate > 0.05) {
    recommendations.push('Review cleaner training and quality control.');
  }

  if (revenuePerCleaner < 500) {
    recommendations.push('Increase marketing or expand branch capacity.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Branch is performing well. Continue monitoring key metrics.');
  }

  return {
    score: Math.round(score),
    recommendations: recommendations.slice(0, 3),
  };
}


