export const dynamic = 'force-dynamic'

/**
 * Jamaica Branch Revenue Dashboard API
 * GET /api/admin/finance/jamaica
 * 
 * Returns revenue metrics for Port Antonio branch
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getJamaicaRevenue,
  getAverageTicketSize,
  getRepeatCustomerRate,
  getServiceMixDistribution,
  getRevenueByWeek,
  getRevenueByMonth,
} from '@/utils/jamaicaFinanceQueries';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get all metrics
    const [
      revenue,
      averageTicketSize,
      repeatCustomerRate,
      serviceMix,
      revenueByWeek,
      revenueByMonth,
    ] = await Promise.all([
      getJamaicaRevenue(startDate, endDate),
      getAverageTicketSize(startDate, endDate),
      getRepeatCustomerRate(startDate, endDate),
      getServiceMixDistribution(startDate, endDate),
      getRevenueByWeek(12),
      getRevenueByMonth(12),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenueJMD: revenue.totalRevenueJMD,
        totalRevenueUSD: revenue.totalRevenueUSD,
        totalRevenueCombined: revenue.totalRevenueCombined,
        jobCount: revenue.jobCount,
        averageTicketSize,
        repeatCustomerRate,
        serviceMixDistribution: serviceMix,
        revenueByWeek,
        revenueByMonth,
      },
    });
  } catch (error: any) {
    console.error('Get Jamaica revenue error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}

