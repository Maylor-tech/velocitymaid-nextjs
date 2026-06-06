export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { executeWeeklyPayouts } from '@/utils/runWeeklyPayouts';

/**
 * Generate Payouts API — POST /api/payouts/generate (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
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
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Generate payouts error:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate payouts' },
      { status: 500 }
    );
  }
}




