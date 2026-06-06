export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'
/**
 * Payout Forecast Engine API
 * GET /api/admin/payouts/jamaica/forecast
 * 
 * Forecasts expected payouts for all active cleaners
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';
import { calculateCleanerEarnings } from '@/app/services/payouts/jamaicaPayoutService';
import { calculateTotalJamaicaBonuses } from '@/utils/jamaicaIncentives';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const searchParams = request.nextUrl.searchParams;
    const weeks = parseInt(searchParams.get('weeks') || '4');

    // Get Port Antonio branch
    const branch = await prisma.branch.findUnique({
      where: { slug: 'port-antonio' },
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Port Antonio branch not found' },
        { status: 404 }
      );
    }

    // Get all active cleaners for Jamaica branch
    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        primaryBranchId: branch.id,
        trainingStatus: {
          overallStatus: 'PASSED',
        },
      },
      include: {
        trainingStatus: true,
        availability: true,
      },
    });

    const now = new Date();
    const forecasts: Array<{
      cleanerId: string;
      cleanerName: string;
      week: string;
      expectedEarnings: number;
      expectedBonuses: {
        jqsBonus: number;
        reviewBonus: number;
        attendanceBonus: number;
        total: number;
      };
      expectedPayout: number;
      jobCount: number;
    }> = [];

    // Forecast for next N weeks
    for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() + weekOffset * 7 - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;

      // For each cleaner, estimate based on past performance
      for (const cleaner of cleaners) {
        // Get past week's performance for estimation
        const pastWeekStart = new Date(weekStart);
        pastWeekStart.setDate(pastWeekStart.getDate() - 7);
        const pastWeekEnd = new Date(pastWeekStart);
        pastWeekEnd.setDate(pastWeekEnd.getDate() + 6);
        pastWeekEnd.setHours(23, 59, 59, 999);

        try {
          const pastEarnings = await calculateCleanerEarnings(
            cleaner.id,
            branch.id,
            pastWeekStart,
            pastWeekEnd
          );

          const pastBonuses = await calculateTotalJamaicaBonuses(
            cleaner.id,
            pastEarnings.jobCount,
            pastWeekStart,
            pastWeekEnd
          );

          // Use past week as estimate (could be improved with more sophisticated forecasting)
          forecasts.push({
            cleanerId: cleaner.id,
            cleanerName: cleaner.name || 'Unknown',
            week: weekLabel,
            expectedEarnings: pastEarnings.totalEarnings,
            expectedBonuses: pastBonuses,
            expectedPayout: pastEarnings.totalEarnings + pastBonuses.total,
            jobCount: pastEarnings.jobCount,
          });
        } catch (error: any) {
          // If no past data, use 0
          forecasts.push({
            cleanerId: cleaner.id,
            cleanerName: cleaner.name || 'Unknown',
            week: weekLabel,
            expectedEarnings: 0,
            expectedBonuses: {
              jqsBonus: 0,
              reviewBonus: 0,
              attendanceBonus: 0,
              total: 0,
            },
            expectedPayout: 0,
            jobCount: 0,
          });
        }
      }
    }

    // Group by week and calculate totals
    const weeklyTotals = new Map<
      string,
      {
        totalEarnings: number;
        totalBonuses: number;
        totalPayouts: number;
        cleanerCount: number;
        jobCount: number;
      }
    >();

    for (const forecast of forecasts) {
      const existing = weeklyTotals.get(forecast.week) || {
        totalEarnings: 0,
        totalBonuses: 0,
        totalPayouts: 0,
        cleanerCount: 0,
        jobCount: 0,
      };

      existing.totalEarnings += forecast.expectedEarnings;
      existing.totalBonuses += forecast.expectedBonuses.total;
      existing.totalPayouts += forecast.expectedPayout;
      existing.cleanerCount += 1;
      existing.jobCount += forecast.jobCount;

      weeklyTotals.set(forecast.week, existing);
    }

    return NextResponse.json({
      success: true,
      data: {
        forecasts,
        weeklyTotals: Array.from(weeklyTotals.entries()).map(([week, totals]) => ({
          week,
          ...totals,
        })),
        totalForecast: {
          totalEarnings: Array.from(weeklyTotals.values()).reduce(
            (sum, w) => sum + w.totalEarnings,
            0
          ),
          totalBonuses: Array.from(weeklyTotals.values()).reduce(
            (sum, w) => sum + w.totalBonuses,
            0
          ),
          totalPayouts: Array.from(weeklyTotals.values()).reduce(
            (sum, w) => sum + w.totalPayouts,
            0
          ),
        },
      },
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Get payout forecast error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}

