export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getAllPayouts, getPayoutsByCleanerId } from '@/utils/payoutData';
import type { PayoutStatus, ServiceRegion } from '@/utils/payoutData';

/**
 * List Payouts API
 * 
 * GET /api/payouts/list?cleanerId=xxx&periodStart=xxx&periodEnd=xxx&status=xxx&branch=xxx
 * 
 * Returns: List of payouts with optional filters
 */
export async function GET(request: NextRequest) {
  // TODO: Protect this route with admin authentication
  // if (!isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const searchParams = request.nextUrl.searchParams;
    const cleanerId = searchParams.get('cleanerId');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const statusParam = searchParams.get('status');
    const branchParam = searchParams.get('branch');

    const status: PayoutStatus | undefined = 
      statusParam && ['pending', 'approved', 'paid'].includes(statusParam)
        ? statusParam as PayoutStatus
        : undefined;

    const branch: ServiceRegion | undefined =
      branchParam === 'new_jersey' || branchParam === 'vermont'
        ? branchParam
        : undefined;

    let payouts;

    if (cleanerId) {
      // Get payouts for specific cleaner
      payouts = getPayoutsByCleanerId(cleanerId);
    } else {
      // Get all payouts (optionally filtered)
      payouts = getAllPayouts({
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        status,
        branch,
      });
    }

    return NextResponse.json({
      success: true,
      payouts,
      count: payouts.length,
    });
  } catch (error: any) {
    console.error('List payouts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}




