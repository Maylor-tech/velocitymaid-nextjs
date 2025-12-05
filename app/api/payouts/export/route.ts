export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getAllPayouts } from '@/utils/payoutData';
import { getAllCleaners } from '@/utils/cleanerData';

/**
 * Export Payouts CSV API
 * 
 * GET /api/payouts/export?periodStart=xxx&periodEnd=xxx&status=xxx&branch=xxx
 * 
 * Returns: CSV file with payout data
 */
export async function GET(request: NextRequest) {
  // TODO: Protect this route with admin authentication
  // if (!isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const searchParams = request.nextUrl.searchParams;
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const statusParam = searchParams.get('status');
    const branchParam = searchParams.get('branch');

    const status = statusParam && ['pending', 'approved', 'paid'].includes(statusParam)
      ? statusParam as 'pending' | 'approved' | 'paid'
      : undefined;

    const branch = branchParam === 'new_jersey' || branchParam === 'vermont'
      ? branchParam
      : undefined;

    // Get payouts
    const payouts = getAllPayouts({
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
      status,
      branch,
    });

    // Get cleaner names
    const cleaners = getAllCleaners();
    const cleanerMap = new Map(cleaners.map(c => [c.id, c.name]));

    // Build CSV
    const headers = [
      'Cleaner Name',
      'Cleaner ID',
      'Branch',
      'Period Start',
      'Period End',
      'Net Payout',
      'Payment Method',
      'Payment Reference',
      'Status',
    ];

    const rows = payouts.map(payout => [
      cleanerMap.get(payout.cleanerId) || payout.cleanerId,
      payout.cleanerId,
      payout.branch === 'new_jersey' ? 'New Jersey' : 'Vermont',
      payout.periodStart,
      payout.periodEnd,
      payout.netPayout.toFixed(2),
      payout.paymentMethod || '',
      payout.paymentReference || '',
      payout.status,
    ]);

    // Convert to CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payouts-${periodStart || 'all'}-${periodEnd || 'all'}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export payouts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export payouts' },
      { status: 500 }
    );
  }
}



