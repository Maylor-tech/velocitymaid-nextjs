export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { JobStatus } from '@prisma/client';
import {
  calculateJobCosts,
  type JobFinancialInput,
} from '@/lib/financial/model';
import {
  aggregateCleanerEarnings,
  cleanerEarningsToArray,
} from '@/lib/financial/aggregation';
import { calculateCleanerLevel, type CleanerLevelMetrics } from '@/lib/cleaner-level';

/**
 * Helper to get cleaner level for a cleaner
 */
async function getCleanerLevel(cleanerId: string): Promise<1 | 2 | 3 | 4 | null> {
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
async function hasUnresolvedComplaint(jobId: string): Promise<boolean> {
  // TODO: Query Complaint model if it exists
  return false;
}

/**
 * POST /api/admin/payouts/run
 * 
 * Creates or updates CleanerPayout records for the specified date range
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body = await request.json();
    const { branchId: branchIdParam, status, dateFrom, dateTo, days } = body;

    // Support both dateFrom/dateTo and days parameter
    let fromDate: Date;
    let toDate: Date;

    if (days) {
      // If days is provided, calculate date range from today
      toDate = new Date();
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - parseInt(String(days)));
    } else if (dateFrom && dateTo) {
      // Use provided date range
      fromDate = new Date(dateFrom);
      toDate = new Date(dateTo);
    } else {
      return NextResponse.json(
        { success: false, error: 'Either (dateFrom and dateTo) or days parameter is required' },
        { status: 400 }
      );
    }

    // Find branch
    let branch;
    if (branchIdParam) {
      branch = await prisma.branch.findUnique({
        where: { id: branchIdParam },
      });
    }

    if (!branch) {
      branch = await prisma.branch.findFirst({
        where: {
          slug: 'new-jersey',
          status: 'ACTIVE',
        },
      });
    }

    if (!branch) {
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
    const eligibleStatuses = status === 'CompletedOnly' ? [JobStatus.COMPLETED] : [JobStatus.COMPLETED];

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
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Convert jobs to financial inputs and calculate breakdowns
    const breakdowns = await Promise.all(
      jobs.map(async (job) => {
        const cleanerLevel = job.assignedCleanerId
          ? await getCleanerLevel(job.assignedCleanerId)
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

    // Aggregate by cleaner
    const cleanerEarningsMap = aggregateCleanerEarnings(breakdowns);
    const cleanerEarningsArray = cleanerEarningsToArray(cleanerEarningsMap);

    // Create or update CleanerPayout records
    const createdPayouts = [];
    const errors = [];

    for (const earnings of cleanerEarningsArray) {
      try {
        // Calculate gross revenue for this cleaner
        const cleanerBreakdowns = breakdowns.filter((b) => b.cleanerId === earnings.cleanerId);
        const grossRevenue = cleanerBreakdowns.reduce((sum, b) => sum + b.grossRevenue, 0);

        // Check if a payout already exists for this cleaner + branch + date range
        const existingPayout = await prisma.cleanerPayout.findFirst({
          where: {
            cleanerId: earnings.cleanerId,
            branchId: branch.id,
            fromDate: {
              lte: toDate,
            },
            toDate: {
              gte: fromDate,
            },
            status: {
              in: ['DRAFT', 'APPROVED', 'LOCKED'],
            },
          },
        });

        if (existingPayout) {
          // Update existing payout
          const updated = await prisma.cleanerPayout.update({
            where: { id: existingPayout.id },
            data: {
              fromDate,
              toDate,
              totalJobs: earnings.jobsCompleted,
              grossRevenue: Math.round(grossRevenue * 100) / 100,
              cleanerEarnings: earnings.earnings,
              bonuses: earnings.bonuses,
              penalties: earnings.penalties,
              branchProfit: earnings.profitContribution,
              status: 'APPROVED', // Auto-approve
              updatedAt: new Date(),
            },
          });
          createdPayouts.push(updated);
        } else {
          // Create new payout
          const created = await prisma.cleanerPayout.create({
            data: {
              cleanerId: earnings.cleanerId,
              branchId: branch.id,
              fromDate,
              toDate,
              totalJobs: earnings.jobsCompleted,
              grossRevenue: Math.round(grossRevenue * 100) / 100,
              cleanerEarnings: earnings.earnings,
              bonuses: earnings.bonuses,
              penalties: earnings.penalties,
              branchProfit: earnings.profitContribution,
              status: 'APPROVED', // Auto-approve
            },
          });
          createdPayouts.push(created);
        }
      } catch (error: any) {
        console.error(`Error creating payout for cleaner ${earnings.cleanerId}:`, error);
        errors.push({
          cleanerId: earnings.cleanerId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      branchId: branch.id,
      dateFrom: fromDate.toISOString(),
      dateTo: toDate.toISOString(),
      payoutsCreated: createdPayouts.length,
      payouts: createdPayouts.map((p) => ({
        id: p.id,
        cleanerId: p.cleanerId,
        branchId: p.branchId,
        fromDate: p.fromDate.toISOString(),
        toDate: p.toDate.toISOString(),
        totalJobs: p.totalJobs,
        cleanerEarnings: p.cleanerEarnings,
        status: p.status,
      })),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Payout run error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create payouts',
      },
      { status: 500 }
    );
  }
}


