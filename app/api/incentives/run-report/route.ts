export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { executeWeeklyIncentiveReport } from '@/utils/runWeeklyIncentiveReport';

/**
 * Run Weekly Incentive Report API — POST /api/incentives/run-report (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
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




