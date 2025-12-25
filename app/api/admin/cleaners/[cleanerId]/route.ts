export const dynamic = 'force-dynamic';

/**
 * Get Cleaner Profile API
 * GET /api/admin/cleaners/[cleanerId]
 * 
 * Returns detailed cleaner profile with stats, availability, training, and jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { calculateCleanerLevel, CleanerLevelMetrics } from '../../../../../lib/cleaner-level';
import { getCleanerAverageJQS } from '../../../../../utils/jobQualityScore';

// Helper to get start of week (Sunday)
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of week (Saturday)
function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Helper to get start of month
function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of month
function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;

    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        Branch_User_primaryBranchIdToBranch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
          },
        },
        CleanerAvailability: true,
        TrainingStatus: {
          select: {
            overallStatus: true,
            lastModuleSlug: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cleaner not found',
        },
        { status: 404 }
      );
    }

    const now = new Date();

    // Weekly job count
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const weeklyJobs = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        preferredDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    // Monthly job count
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyJobs = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        preferredDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    // Completion rate (completed vs total assigned)
    const totalAssigned = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    const completedCount = await prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        status: 'completed',
      },
    });

    const completionRate = totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0;

    // Average JQS
    const avgJQS = await getCleanerAverageJQS(cleanerId);

    // Ratings summary
    const allRatings = await prisma.cleanerRating.findMany({
      where: { cleanerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        Customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        Job: {
          select: {
            id: true,
            preferredDate: true,
          },
        },
      },
    });

    const ratingsCount = await prisma.cleanerRating.count({
      where: { cleanerId },
    });

    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : 0;

    const formattedRatings = allRatings.map((rating) => ({
      id: rating.id,
      rating: rating.rating,
      comment: rating.comment,
      customerName: rating.Customer
        ? `${rating.Customer.firstName} ${rating.Customer.lastName}`
        : null,
      jobId: rating.jobId,
      createdAt: rating.createdAt.toISOString(),
    }));

    // Performance metrics - productivity score
    let productivityScore = 0;
    productivityScore += Math.min(weeklyJobs, 10) * 3; // Up to 30 points for weekly jobs
    productivityScore += (completionRate / 100) * 30; // Up to 30 points for completion rate
    productivityScore += (avgRating / 5) * 30; // Up to 30 points for ratings
    if (productivityScore > 100) productivityScore = 100;

    // Payout summary (Jamaica payouts)
    const latestPayouts = await prisma.jamaicaPayout.findMany({
      where: { cleanerId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const allPayouts = await prisma.jamaicaPayout.findMany({
      where: {
        cleanerId,
        status: 'PAID',
      },
      select: {
        totalAmount: true,
      },
    });

    const totalPaid = allPayouts.reduce((sum, payout) => sum + Number(payout.totalAmount), 0);

    const formattedPayouts = latestPayouts.map((payout) => ({
      id: payout.id,
      periodStart: payout.periodStart.toISOString(),
      periodEnd: payout.periodEnd.toISOString(),
      totalAmount: Number(payout.totalAmount),
      currency: payout.currency,
      status: payout.status,
      branch: payout.Branch,
      createdAt: payout.createdAt.toISOString(),
    }));

    // Compliance check
    const cleanerApplication = await prisma.cleanerApplication.findFirst({
      where: {
        email: cleaner.email,
        status: 'APPROVED',
      },
      select: {
        idUploadUrl: true,
        referencesUploadUrl: true,
      },
    });

    const issues: string[] = [];
    let complianceStatus: 'COMPLIANT' | 'MISSING_TRAINING' | 'MISSING_DOCS' = 'COMPLIANT';

    // Check training status (for Jamaica branches)
    const isJamaicaBranch =
      cleaner.Branch_User_primaryBranchIdToBranch?.country === 'Jamaica' ||
      cleaner.Branch_User_primaryBranchIdToBranch?.country === 'JM';

    if (isJamaicaBranch) {
      if (!cleaner.TrainingStatus || cleaner.TrainingStatus.overallStatus !== 'PASSED') {
        complianceStatus = 'MISSING_TRAINING';
        issues.push('Training not completed or not passed');
      }
    }

    // Check documents
    if (!cleanerApplication) {
      complianceStatus = 'MISSING_DOCS';
      issues.push('Cleaner application not found');
    } else {
      if (!cleanerApplication.idUploadUrl) {
        complianceStatus = 'MISSING_DOCS';
        issues.push('ID document not uploaded');
      }
      if (!cleanerApplication.referencesUploadUrl) {
        complianceStatus = 'MISSING_DOCS';
        issues.push('References document not uploaded');
      }
    }

    // Upcoming jobs (next 10)
    const upcomingJobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        preferredDate: {
          gte: new Date(),
        },
        status: {
          notIn: ['cancelled', 'completed'],
        },
      },
      take: 10,
      orderBy: { preferredDate: 'asc' },
      include: {
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Recent completed jobs (latest 10)
    const recentJobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        status: 'completed',
      },
      take: 10,
      orderBy: { completedAt: 'desc' },
      include: {
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Format cleaner data
    const formattedCleaner = {
      id: cleaner.id,
      name: cleaner.name || 'Unknown',
      email: cleaner.email,
      isActive: cleaner.isActive,
      preferredCities: cleaner.preferredCities || [],
      primaryBranch: cleaner.Branch_User_primaryBranchIdToBranch,
      availability: cleaner.CleanerAvailability
        ? {
            workingDays: cleaner.CleanerAvailability.workingDays,
            timeRanges: cleaner.CleanerAvailability.timeRanges,
            maxDailyJobs: cleaner.CleanerAvailability.maxDailyJobs,
            blackoutDates: cleaner.CleanerAvailability.blackoutDates || [],
            isActive: cleaner.CleanerAvailability.isActive,
          }
        : null,
      trainingStatus: cleaner.TrainingStatus
        ? {
            overallStatus: cleaner.TrainingStatus.overallStatus,
            lastModuleSlug: cleaner.TrainingStatus.lastModuleSlug,
            updatedAt: cleaner.TrainingStatus.updatedAt.toISOString(),
          }
        : null,
    };

    // Format jobs
    const formattedUpcomingJobs = upcomingJobs.map((job) => ({
      id: job.id,
      preferredDate: job.preferredDate?.toISOString() || null,
      preferredTime: job.preferredTime,
      status: job.status,
      customerName: job.customerName || (job.Customer ? `${job.Customer.firstName} ${job.Customer.lastName}` : null),
      customer: job.Customer,
      branch: job.Branch,
      address: job.address,
      serviceType: job.serviceType,
    }));

    const formattedRecentJobs = recentJobs.map((job) => ({
      id: job.id,
      preferredDate: job.preferredDate?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      customerName: job.customerName || (job.Customer ? `${job.Customer.firstName} ${job.Customer.lastName}` : null),
      customer: job.Customer,
      branch: job.Branch,
      jobQualityScore: job.jobQualityScore,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      currency: job.currency,
    }));

    return NextResponse.json({
      success: true,
      cleaner: formattedCleaner,
      stats: {
        weeklyJobs,
        monthlyJobs,
        completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
        avgJQS: Math.round(avgJQS * 10) / 10, // Round to 1 decimal
        totalAssigned,
        completedCount,
      },
      ratings: {
        average: Math.round(avgRating * 10) / 10,
        count: ratingsCount,
        recent: formattedRatings,
      },
      performance: {
        completionRate: Math.round(completionRate * 10) / 10,
        productivityScore: Math.round(productivityScore * 10) / 10,
      },
      payouts: {
        latest: formattedPayouts,
        totalPaid: Math.round(totalPaid * 100) / 100,
      },
      compliance: {
        status: complianceStatus,
        issues,
      },
      upcomingJobs: formattedUpcomingJobs,
      recentJobs: formattedRecentJobs,
      // Phase 3 Part E: Cleaner Level
      level: (() => {
        // Get all jobs for level calculation (already fetched above, use existing data)
        // Calculate days since first job from existing job data
        const firstJob = recentJobs.length > 0 
          ? recentJobs[recentJobs.length - 1] // Oldest job (if sorted by createdAt asc)
          : upcomingJobs.length > 0 
          ? upcomingJobs[0] 
          : null;
        
        const daysSinceFirstJob = firstJob?.preferredDate
          ? Math.floor(
              (new Date().getTime() - new Date(firstJob.preferredDate).getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        const metrics: CleanerLevelMetrics = {
          daysSinceFirstJob,
          totalJobs: totalAssigned,
          completedJobs: completedCount,
          averageRating: avgRating,
          completionRate: Math.round(completionRate * 10) / 10,
          productivityScore: Math.round(productivityScore * 10) / 10,
          complaintsCount: 0, // TODO: Get from complaints table
        };

        return calculateCleanerLevel(metrics);
      })(),
    });
  } catch (err: any) {
    console.error('CLEANER_PROFILE_ERROR:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to load cleaner profile',
      },
      { status: 500 }
    );
  }
}

