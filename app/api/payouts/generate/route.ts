import { NextRequest, NextResponse } from 'next/server';
import { executeWeeklyPayouts } from '@/utils/runWeeklyPayouts';

/**
 * Generate Payouts API
 * 
 * POST /api/payouts/generate
 * 
 * Manually triggers payout generation for a given period
 * TODO: Protect this route with admin authentication
 */
export async function POST(request: NextRequest) {
  // TODO: Add admin authentication check
  // if (!isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const body = await request.json();
    const { periodStart, periodEnd } = body;

    // If period not specified, use last week
    if (!periodStart || !periodEnd) {
      console.log('Manual weekly payout generation triggered (last week)');
      const summary = await executeWeeklyPayouts();

      return NextResponse.json({
        success: true,
        summary,
        message: 'Weekly payout generation completed successfully',
      });
    }

    // TODO: Generate for specific period
    // For now, just use the weekly function
    const summary = await executeWeeklyPayouts();

    return NextResponse.json({
      success: true,
      summary,
      message: 'Payout generation completed successfully',
    });
  } catch (error: any) {
    console.error('Generate payouts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate payouts' },
      { status: 500 }
    );
  }
}



