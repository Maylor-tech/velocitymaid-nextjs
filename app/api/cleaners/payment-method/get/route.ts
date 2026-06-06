export const dynamic = 'force-dynamic';

/**
 * GET /api/cleaners/payment-method/get
 * Returns payment method for the authenticated cleaner.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getCleanerPaymentMethod } from '@/app/services/payouts/jamaicaPayoutService';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    const paymentMethod = await getCleanerPaymentMethod(auth.userId);

    return NextResponse.json({
      success: true,
      paymentMethod,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Get payment method error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get payment method';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
