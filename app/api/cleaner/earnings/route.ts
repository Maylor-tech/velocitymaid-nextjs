export const dynamic = 'force-dynamic';

/**
 * Phase 2C: Cleaner Earnings API
 * GET /api/cleaner/earnings
 * 
 * Returns completed jobs and earnings totals for authenticated cleaner
 * 
 * Rules:
 * - Only authenticated cleaners can access
 * - Cleaner can ONLY see jobs where assignedCleanerId === cleaner.id
 * - Source of truth: Job table
 * - Only includes jobs with status === "COMPLETED"
 * - Read-only: No data modification
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { PHASE_LOCK } from '@/lib/phaseLock';

// 🔒 Phase 2C locked — read-only earnings

export async function GET(request: NextRequest) {
  try {
    // Phase 2C: Authenticate cleaner using existing auth helper
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    // Phase 2C: Fetch completed jobs for this cleaner
    // Security: Only jobs where assignedCleanerId === cleanerId
    // Source of truth: Job table (not JobPayout)
    const completedJobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        createdAt: true,
        serviceType: true,
        totalPrice: true,
        paymentStatus: true,
        currency: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Phase 2C: Calculate totals
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    let lifetimeTotal = 0;
    let monthTotal = 0;
    let weekTotal = 0;

    const jobs = completedJobs.map((job) => {
      const price = job.totalPrice ? Number(job.totalPrice) : 0;
      const jobDate = new Date(job.createdAt);

      lifetimeTotal += price;

      if (jobDate >= monthStart) {
        monthTotal += price;
      }

      if (jobDate >= weekStart) {
        weekTotal += price;
      }

      return {
        id: job.id,
        createdAt: job.createdAt.toISOString(),
        serviceType: job.serviceType,
        totalPrice: price,
        paymentStatus: job.paymentStatus,
        currency: job.currency || 'USD',
      };
    });

    return NextResponse.json({
      success: true,
      jobs,
      totals: {
        lifetimeTotal,
        monthTotal,
        weekTotal,
      },
    });
  } catch (error: any) {
    console.error('[CLEANER_EARNINGS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch earnings',
      },
      { status: error.status || 500 }
    );
  }
}
