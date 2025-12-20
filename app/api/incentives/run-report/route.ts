export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { executeWeeklyIncentiveReport } from '@/utils/runWeeklyIncentiveReport';

/**
 * Run Weekly Incentive Report API
 * 
 * POST /api/incentives/run-report
 * 
 * Manually triggers weekly incentive report calculation
 * TODO: Protect this route with admin authentication
 */
export async function POST(request: NextRequest) {
  // TODO: Add admin authentication check
  // if (!isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    console.log('Manual weekly incentive report triggered');
    const summary = await executeWeeklyIncentiveReport();

    return NextResponse.json({
      success: true,
      summary,
      message: 'Weekly incentive report completed successfully',
    });
  } catch (error: any) {
    console.error('Run incentive report error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to run incentive report' },
      { status: 500 }
    );
  }
}




