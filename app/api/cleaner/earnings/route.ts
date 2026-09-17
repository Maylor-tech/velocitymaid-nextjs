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

// Read-only earnings (+ tips for authenticated cleaner only)

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

    const tips = await prisma.tip.findMany({
      where: {
        beneficiaryCleanerId: cleanerId,
        status: { in: ['RECEIVED', 'PAID_OUT', 'succeeded'] },
      },
      select: {
        id: true,
        jobId: true,
        amount: true,
        currency: true,
        status: true,
        receivedAt: true,
        paidOutAt: true,
        createdAt: true,
        internalReference: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let readyPayoutTotal = 0;
    let paidPayoutTotal = 0;
    let serviceEarningsTotal = 0;
    for (const payout of jobPayouts) {
      const amount = Number(payout.cleanerAmount);
      serviceEarningsTotal += amount;
      if (payout.status === 'READY') readyPayoutTotal += amount;
      if (payout.status === 'PAID') paidPayoutTotal += amount;
    }

    let tipsReceivedTotal = 0;
    let tipsPaidOutTotal = 0;
    for (const tip of tips) {
      const dollars = tip.amount / 100;
      const upper = tip.status.toUpperCase();
      const st = upper === 'SUCCEEDED' ? 'RECEIVED' : upper;
      if (st === 'RECEIVED') tipsReceivedTotal += dollars;
      if (st === 'PAID_OUT') {
        tipsPaidOutTotal += dollars;
        tipsReceivedTotal += dollars;
      }
    }

    // Phase 2C: Calculate totals
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setMonth(now.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    // Service earnings from JobPayout only — never customer totalPrice.
    let lifetimeTotal = 0;
    let monthTotal = 0;
    let weekTotal = 0;

    const jobs = completedJobs.map((job) => {
      const payoutAmount = job.JobPayout
        ? Number(job.JobPayout.cleanerAmount)
        : 0;
      const jobDate = new Date(job.createdAt);

      lifetimeTotal += payoutAmount;

      if (jobDate >= monthStart) {
        monthTotal += payoutAmount;
      }

      if (jobDate >= weekStart) {
        weekTotal += payoutAmount;
      }

      return {
        id: job.id,
        createdAt: job.createdAt.toISOString(),
        serviceType: job.serviceType,
        /** @deprecated customer invoice — do not treat as cleaner pay */
        totalPrice: job.totalPrice ? Number(job.totalPrice) : 0,
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
        serviceEarnings: serviceEarningsTotal,
        tips: tipsReceivedTotal,
        total: serviceEarningsTotal + tipsReceivedTotal,
      },
      tips: {
        receivedTotal: tipsReceivedTotal,
        paidOutTotal: tipsPaidOutTotal,
        items: tips.map((t) => ({
          id: t.id,
          jobId: t.jobId,
          amount: t.amount / 100,
          amountCents: t.amount,
          currency: t.currency,
          status:
            t.status.toUpperCase() === 'SUCCEEDED' ? 'RECEIVED' : t.status,
          receivedAt: t.receivedAt?.toISOString() ?? null,
          paidOutAt: t.paidOutAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
          internalReference: t.internalReference,
        })),
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
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[CLEANER_EARNINGS] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch earnings';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
