export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper functions for date calculations
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
  const diff = d.getDate() - day;
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

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// GET /api/admin/branches/[branchId]/insights
export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, currency: true },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Jobs Summary
    const allJobs = await prisma.job.findMany({
      where: {
        branchId,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        id: true,
        status: true,
        assignedCleanerId: true,
        totalPrice: true,
        currency: true,
      },
    });

    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter((j) => j.status === 'completed').length;
    const cancelledJobs = allJobs.filter((j) => j.status === 'cancelled').length;
    const unassignedJobs = allJobs.filter((j) => !j.assignedCleanerId && j.status !== 'cancelled' && j.status !== 'completed').length;

    const cancellationRate = totalJobs > 0 ? (cancelledJobs / totalJobs) * 100 : 0;

    // Ratings
    const cleanersInBranch = await prisma.user.findMany({
      where: {
        primaryBranchId: branchId,
        role: 'CLEANER',
      },
      select: { id: true },
    });

    const cleanerIds = cleanersInBranch.map((c) => c.id);
    const ratings = await prisma.cleanerRating.findMany({
      where: {
        cleanerId: { in: cleanerIds },
      },
      select: { rating: true },
    });

    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;
    const totalReviews = ratings.length;

    // Revenue
    const completedJobsWithPrice = allJobs.filter(
      (j) => j.status === 'completed' && j.totalPrice
    );
    let totalRevenue = 0;
    for (const job of completedJobsWithPrice) {
      const amount = Number(job.totalPrice);
      // Convert JMD to USD (approximate rate)
      if (job.currency === 'JMD') {
        totalRevenue += amount * 0.0065;
      } else {
        totalRevenue += amount;
      }
    }

    // Projected revenue (based on pending/assigned jobs)
    const pendingJobs = allJobs.filter(
      (j) => ['pending', 'assigned'].includes(j.status) && j.totalPrice
    );
    let projectedRevenue = 0;
    for (const job of pendingJobs) {
      const amount = Number(job.totalPrice);
      if (job.currency === 'JMD') {
        projectedRevenue += amount * 0.0065;
      } else {
        projectedRevenue += amount;
      }
    }

    // Cleaners
    const totalCleaners = cleanersInBranch.length;
    const activeCleaners = await prisma.user.count({
      where: {
        primaryBranchId: branchId,
        role: 'CLEANER',
        isActive: true,
      },
    });

    const trainingPending = await prisma.trainingStatus.count({
      where: {
        User: {
          primaryBranchId: branchId,
          role: 'CLEANER',
        },
        overallStatus: {
          in: ['PENDING', 'IN_REVIEW', 'NOT_STARTED'],
        },
      },
    });

    // Complaints (if Complaint model exists, otherwise use placeholder)
    // TODO: Replace with actual Complaint model queries when schema is updated
    const openComplaints = 0; // Placeholder
    const resolvedComplaints = 0; // Placeholder
    const severityBreakdown = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    // Payouts owed (Jamaica payouts)
    const payoutsOwed = await prisma.jamaicaPayout.aggregate({
      where: {
        Branch: {
          id: branchId,
        },
        status: 'PENDING',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const payoutsOwedAmount = payoutsOwed._sum.totalAmount
      ? Number(payoutsOwed._sum.totalAmount)
      : 0;

    // Jobs per cleaner
    const jobsPerCleaner = totalCleaners > 0 ? totalJobs / totalCleaners : 0;

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        currency: branch.currency,
      },
      jobsSummary: {
        total: totalJobs,
        completed: completedJobs,
        cancelled: cancelledJobs,
        unassigned: unassignedJobs,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
      },
      ratings: {
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        totalReviews,
      },
      revenue: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
      },
      cleaners: {
        totalCleaners,
        activeCleaners,
        trainingPending,
        jobsPerCleaner: Math.round(jobsPerCleaner * 10) / 10,
      },
      complaints: {
        open: openComplaints,
        resolved: resolvedComplaints,
        severityBreakdown,
      },
      payouts: {
        owed: payoutsOwedAmount,
      },
    });
  } catch (error: any) {
    console.error('BRANCH_INSIGHTS_ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch branch insights',
      },
      { status: 500 }
    );
  }
}

















