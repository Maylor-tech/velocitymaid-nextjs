export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

// GET /api/admin/payouts
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const cleanerId = searchParams.get('cleanerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const where: any = {};

    if (branchId) {
      where.Branch = { id: branchId };
    }

    if (cleanerId) {
      where.cleanerId = cleanerId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Get payouts (using JamaicaPayout model for now)
    const payouts = await prisma.jamaicaPayout.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
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
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Format payouts with calculated totals
    const formattedPayouts = await Promise.all(
      payouts.map(async (payout) => {
        // Get jobs for this cleaner in the payout period
        const jobs = await prisma.job.findMany({
          where: {
            assignedCleanerId: payout.cleanerId,
            completedAt: {
              gte: payout.periodStart,
              lte: payout.periodEnd,
            },
            status: 'completed',
          },
          select: {
            id: true,
            totalPrice: true,
            currency: true,
          },
        });

        const totalJobs = jobs.length;
        const baseEarnings = jobs.reduce(
          (sum, job) => sum + (job.totalPrice ? Number(job.totalPrice) : 0),
          0
        );

        // TODO: Get incentives and penalties when models are available
        const bonuses = 0; // Placeholder
        const penalties = 0; // Placeholder
        const deductions = 0; // Placeholder

        const finalPayout = baseEarnings + bonuses - penalties - deductions;

        return {
          id: payout.id,
          cleanerId: payout.cleanerId,
          cleanerName: payout.User?.name || 'Unknown',
          cleanerEmail: payout.User?.email || '',
          branchId: payout.branchId,
          branchName: payout.Branch?.name || 'Unknown',
          periodStart: payout.periodStart.toISOString(),
          periodEnd: payout.periodEnd.toISOString(),
          totalJobs,
          baseEarnings,
          bonuses,
          penalties,
          deductions,
          finalPayout,
          currency: payout.currency,
          status: payout.status,
          createdAt: payout.createdAt.toISOString(),
          updatedAt: payout.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      payouts: formattedPayouts,
      count: formattedPayouts.length,
    });
  } catch (error: any) {
    console.error('Get payouts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get payouts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payouts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cleanerId, jobs, incentives, penalties, total, currency, branchId } = body;

    if (!cleanerId || !total) {
      return NextResponse.json(
        { success: false, error: 'cleanerId and total are required' },
        { status: 400 }
      );
    }

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Calculate period from jobs if provided
    let periodStart = new Date();
    let periodEnd = new Date();

    if (jobs && jobs.length > 0) {
      const jobDates = jobs.map((j: any) => new Date(j.completedAt || j.date)).filter(Boolean);
      if (jobDates.length > 0) {
        periodStart = new Date(Math.min(...jobDates.map((d: Date) => d.getTime())));
        periodEnd = new Date(Math.max(...jobDates.map((d: Date) => d.getTime())));
      }
    }

    // Create payout record
    const payout = await prisma.jamaicaPayout.create({
      data: {
        cleanerId,
        branchId: branchId || cleaner.primaryBranchId || null,
        periodStart,
        periodEnd,
        totalAmount: total,
        currency: currency || 'USD',
        status: 'PENDING',
        // TODO: Store breakdown in metadata when schema supports it
        // metadata: { jobs, incentives, penalties },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        cleanerId: payout.cleanerId,
        cleanerName: payout.User?.name || 'Unknown',
        totalAmount: Number(payout.totalAmount),
        currency: payout.currency,
        status: payout.status,
        periodStart: payout.periodStart.toISOString(),
        periodEnd: payout.periodEnd.toISOString(),
        createdAt: payout.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Create payout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payout' },
      { status: 500 }
    );
  }
}


