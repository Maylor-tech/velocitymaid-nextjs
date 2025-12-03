import { NextRequest, NextResponse } from 'next/server';
import { getAllIncentives, getIncentivesByCleanerId } from '@/utils/incentiveData';

/**
 * List Incentives API
 * 
 * GET /api/incentives/list?cleanerId=xxx&periodStart=xxx&periodEnd=xxx
 * 
 * Returns: List of incentives with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cleanerId = searchParams.get('cleanerId');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    let incentives;

    if (cleanerId) {
      // Get incentives for specific cleaner
      incentives = getIncentivesByCleanerId(cleanerId);
    } else {
      // Get all incentives (optionally filtered by period)
      incentives = getAllIncentives(
        periodStart || undefined,
        periodEnd || undefined
      );
    }

    return NextResponse.json({
      success: true,
      incentives,
      count: incentives.length,
    });
  } catch (error: any) {
    console.error('List incentives error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch incentives' },
      { status: 500 }
    );
  }
}



