export const dynamic = 'force-dynamic';

/**
 * POST /api/cleaners/payment-method/update
 * Updates payment method for the authenticated cleaner only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { updateCleanerPaymentMethod } from '@/app/services/payouts/jamaicaPayoutService';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    const body = await request.json();
    const { bankName, accountNumber, accountType, whatsappNumber } = body;

    const paymentMethod = await updateCleanerPaymentMethod(auth.userId, {
      bankName,
      accountNumber,
      accountType,
      whatsappNumber,
    });

    return NextResponse.json({
      success: true,
      paymentMethod,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Update payment method error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update payment method';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
