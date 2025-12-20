export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import {
  getBranchRevenue,
  getBranchAverages,
  getBranchTrends,
  estimateBranchCosts,
  DateRange,
} from '@/utils/branchProfitQueries';

/**
 * Branch Profitability Dashboard API
 * 
 * GET /api/dashboard/profit?range=today|week|month
 * 
 * Returns: All profitability data for the selected range
 */
export async function GET(request: NextRequest) {
  // TODO: Protect this route with admin authentication
  // if (!isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get('range') || 'month';
    
    const range: DateRange = 
      rangeParam === 'today' ? 'today' :
      rangeParam === 'week' ? 'week' :
      'month';

    // Fetch all data in parallel
    const [revenue, averages, trends, profitability] = await Promise.all([
      getBranchRevenue(range),
      getBranchAverages(range),
      getBranchTrends(range),
      estimateBranchCosts(range),
    ]);

    return NextResponse.json({
      success: true,
      range,
      data: {
        revenue,
        averages,
        trends,
        profitability,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Branch profitability fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch profitability data',
      },
      { status: 500 }
    );
  }
}




