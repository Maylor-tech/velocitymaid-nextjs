export const dynamic = 'force-dynamic';

/**
 * Get Branch Metrics API
 * GET /api/admin/branches/[branchId]/metrics
 * 
 * Returns branch KPIs: jobs today, jobs this week, unassigned jobs,
 * active cleaners, customers, weekly revenue
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get start of day
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of day
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Branch not found',
        },
        { status: 404 }
      );
    }

    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Jobs today
    const jobsToday = await prisma.job.count({
      where: {
        branchId,
        preferredDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    // Jobs this week
    const jobsWeek = await prisma.job.count({
      where: {
        branchId,
        preferredDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    // Unassigned jobs
    const unassignedJobs = await prisma.job.count({
      where: {
        branchId,
        assignedCleanerId: null,
        status: {
          notIn: ['cancelled', 'completed'],
        },
        preferredDate: {
          gte: new Date(),
        },
      },
    });

    // Active cleaners (approved applications)
    const activeCleaners = await prisma.cleanerApplication.count({
      where: {
        branchId,
        status: 'APPROVED',
      },
    });

    // Customers
    const customers = await prisma.customer.count({
      where: {
        branchId,
      },
    });

    // Weekly revenue
    const weeklyJobs = await prisma.job.findMany({
      where: {
        branchId,
        preferredDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
      select: {
        totalPrice: true,
        currency: true,
      },
    });

    // Calculate revenue (convert JMD to USD if needed, or sum by currency)
    let revenueWeek = 0;
    for (const job of weeklyJobs) {
      if (job.totalPrice) {
        const amount = Number(job.totalPrice);
        // For simplicity, assume 1 JMD = 0.0065 USD (approximate)
        // In production, use actual exchange rates
        if (job.currency === 'JMD') {
          revenueWeek += amount * 0.0065;
        } else {
          revenueWeek += amount;
        }
      }
    }

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
      },
      metrics: {
        jobsToday,
        jobsWeek,
        unassignedJobs,
        cleaners: activeCleaners,
        customers,
        revenueWeek: Math.round(revenueWeek * 100) / 100,
      },
    });
  } catch (err: any) {
    console.error('BRANCH_METRICS_ERROR:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch branch metrics',
      },
      { status: 500 }
    );
  }
}

