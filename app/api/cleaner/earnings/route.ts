export const runtime = 'nodejs';
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
        JobPayout: {
          select: {
            id: true,
            status: true,
            cleanerAmount: true,
            currency: true,
            paidAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const jobPayouts = await prisma.jobPayout.findMany({
      where: { cleanerId },
      select: {
        id: true,
        jobId: true,
        status: true,
        cleanerAmount: true,
        currency: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let readyPayoutTotal = 0;
    let paidPayoutTotal = 0;
    for (const payout of jobPayouts) {
      const amount = Number(payout.cleanerAmount);
      if (payout.status === 'READY') readyPayoutTotal += amount;
      if (payout.status === 'PAID') paidPayoutTotal += amount;
    }

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
        payoutStatus: job.JobPayout?.status ?? null,
        payoutAmount: job.JobPayout ? Number(job.JobPayout.cleanerAmount) : null,
        payoutPaidAt: job.JobPayout?.paidAt?.toISOString() ?? null,
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
      payouts: {
        readyTotal: readyPayoutTotal,
        paidTotal: paidPayoutTotal,
        items: jobPayouts.map((p) => ({
          id: p.id,
          jobId: p.jobId,
          status: p.status,
          amount: Number(p.cleanerAmount),
          currency: p.currency,
          paidAt: p.paidAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
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
