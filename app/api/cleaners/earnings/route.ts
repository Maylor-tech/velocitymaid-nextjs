export const dynamic = 'force-dynamic';

/**
 * Cleaner Earnings Dashboard API
 * GET /api/cleaners/earnings
 * 
 * Returns earnings data for authenticated cleaner
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { calculateCleanerEarnings } from '@/app/services/payouts/jamaicaPayoutService';
import { calculateTotalJamaicaBonuses } from '@/utils/jamaicaIncentives';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get cleaner and branch
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        primaryBranch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            currency: true,
          },
        },
      },
    });

    if (!cleaner || !cleaner.primaryBranch) {
      return NextResponse.json(
        { success: false, error: 'Cleaner or branch not found' },
        { status: 404 }
      );
    }

    // Check if Jamaica branch
    const isJamaicaBranch =
      cleaner.primaryBranch.country === 'Jamaica' ||
      cleaner.primaryBranch.country === 'JM' ||
      cleaner.primaryBranch.slug === 'port-antonio';

    if (!isJamaicaBranch) {
      return NextResponse.json(
        { success: false, error: 'Earnings dashboard only available for Jamaica branches' },
        { status: 403 }
      );
    }

    const branchId = cleaner.primaryBranch.id;

    // Get current week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get last 4 weeks
    const weeks: Array<{
      weekStart: Date;
      weekEnd: Date;
      earnings: number;
      bonuses: number;
      jobCount: number;
    }> = [];

    for (let i = 3; i >= 0; i--) {
      const start = new Date(weekStart);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const earningsData = await calculateCleanerEarnings(
        cleanerId,
        branchId,
        start,
        end
      );

      const bonuses = await calculateTotalJamaicaBonuses(
        cleanerId,
        earningsData.jobCount,
        start,
        end
      );

      weeks.push({
        weekStart: start,
        weekEnd: end,
        earnings: earningsData.totalEarnings,
        bonuses: bonuses.total,
        jobCount: earningsData.jobCount,
      });
    }

    // Get pending payouts
    const pendingPayouts = await prisma.jamaicaPayout.findMany({
      where: {
        cleanerId,
        branchId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        totalAmount: true,
        status: true,
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    // Calculate current week projection
    const currentWeekEarnings = await calculateCleanerEarnings(
      cleanerId,
      branchId,
      weekStart,
      now
    );
    const currentWeekBonuses = await calculateTotalJamaicaBonuses(
      cleanerId,
      currentWeekEarnings.jobCount,
      weekStart,
      now
    );

    // Get earnings calendar (last 30 days)
    const calendarStart = new Date(now);
    calendarStart.setDate(calendarStart.getDate() - 30);
    const calendarEarnings = await calculateCleanerEarnings(
      cleanerId,
      branchId,
      calendarStart,
      now
    );

    return NextResponse.json({
      success: true,
      data: {
        weeklyEarnings: weeks,
        currentWeek: {
          earnings: currentWeekEarnings.totalEarnings,
          bonuses: currentWeekBonuses.total,
          jobCount: currentWeekEarnings.jobCount,
          projection: currentWeekEarnings.totalEarnings + currentWeekBonuses.total,
        },
        pendingPayouts: pendingPayouts.map((p) => ({
          id: p.id,
          period: `${p.periodStart.toLocaleDateString()} - ${p.periodEnd.toLocaleDateString()}`,
          amount: p.totalAmount,
          status: p.status,
        })),
        bonusesEarned: {
          thisWeek: currentWeekBonuses,
          last4Weeks: weeks.map((w) => w.bonuses),
        },
        earningsCalendar: {
          last30Days: calendarEarnings.totalEarnings,
          jobCount: calendarEarnings.jobCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Get cleaner earnings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

