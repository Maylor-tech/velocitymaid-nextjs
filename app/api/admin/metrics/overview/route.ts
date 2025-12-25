export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * GET /api/admin/metrics/overview
 * 
 * Returns comprehensive metrics for the selected branch
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // Step 1: Find branch (prefer new-jersey, fallback to first ACTIVE)
    let branch = await prisma.branch.findFirst({
      where: {
        slug: 'new-jersey',
        status: 'ACTIVE',
      },
    });

    if (!branch) {
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

    // Step 2: Compute time ranges
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const last14DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last60DaysStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Step 3: Compute KPIs

    // Jobs today
    const jobsToday = await prisma.job.count({
      where: {
        branchId: branch.id,
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
        branchId: branch.id,
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
        branchId: branch.id,
        assignedCleanerId: null,
        status: {
          in: ['pending', 'assigned'],
        },
      },
    });

    // Active cleaners (connected to this branch)
    const activeCleaners = await prisma.user.count({
      where: {
        role: 'CLEANER',
        isActive: true,
        OR: [
          { primaryBranchId: branch.id },
          {
            UserBranch: {
              some: {
                branchId: branch.id,
              },
            },
          },
        ],
      },
    });

    // Total customers
    const totalCustomers = await prisma.customer.count({
      where: {
        branchId: branch.id,
      },
    });

    // Revenue this week (sum of completed jobs)
    const completedJobsThisWeek = await prisma.job.findMany({
      where: {
        branchId: branch.id,
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

    // Job status distribution
    const allJobs = await prisma.job.findMany({
      where: {
        branchId: branch.id,
      },
      select: {
        status: true,
      },
    });

    const statusCounts: Record<string, number> = {};
    allJobs.forEach((job) => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });

    const jobStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Jobs last 14 days
    const jobsLast14DaysData = await prisma.job.findMany({
      where: {
        branchId: branch.id,
        preferredDate: {
          gte: last14DaysStart,
          lte: now,
        },
      },
      select: {
        preferredDate: true,
      },
    });

    // Build array of last 14 days with counts
    const jobsLast14Days: Array<{ date: string; count: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDate(date);
      const count = jobsLast14DaysData.filter((job) => {
        if (!job.preferredDate) return false;
        return formatDate(job.preferredDate) === dateStr;
      }).length;
      jobsLast14Days.push({ date: dateStr, count });
    }

    // Top cleaners (last 60 days)
    const cleanersInBranch = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        OR: [
          { primaryBranchId: branch.id },
          {
            UserBranch: {
              some: {
                branchId: branch.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const topCleanersData = await Promise.all(
      cleanersInBranch.map(async (cleaner) => {
        // Get completed jobs in last 60 days
        const completedJobs = await prisma.job.findMany({
          where: {
            branchId: branch.id,
            assignedCleanerId: cleaner.id,
            status: 'completed',
            completedAt: {
              gte: last60DaysStart,
            },
          },
        });

        const jobsCompleted = completedJobs.length;

        // Get all jobs for completion rate
        const allJobsForCleaner = await prisma.job.findMany({
          where: {
            branchId: branch.id,
            assignedCleanerId: cleaner.id,
          },
        });

        const totalJobs = allJobsForCleaner.length;
        const completionRate = totalJobs > 0 ? Math.round((jobsCompleted / totalJobs) * 100) : 0;

        // Get average rating
        const ratings = await prisma.cleanerRating.findMany({
          where: {
            cleanerId: cleaner.id,
          },
        });

        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : null;

        return {
          cleanerId: cleaner.id,
          name: cleaner.name,
          email: cleaner.email,
          jobsCompleted,
          averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
          completionRate,
        };
      })
    );

    // Sort by jobs completed (descending) and take top 10
    const topCleaners = topCleanersData
      .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
      .slice(0, 10);

    return NextResponse.json({
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        city: branch.city,
        state: branch.state,
      },
      kpis: {
        jobsToday,
        jobsThisWeek,
        unassignedJobs,
        activeCleaners,
        totalCustomers,
        revenueThisWeek: Math.round(revenueThisWeek * 100) / 100,
      },
      jobStatusDistribution,
      jobsLast14Days,
      topCleaners,
    });
  } catch (error: any) {
    console.error('Metrics overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}















