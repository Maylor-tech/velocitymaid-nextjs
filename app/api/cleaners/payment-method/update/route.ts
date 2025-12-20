export const dynamic = 'force-dynamic'

/**
 * Update Cleaner Payment Method API
 * POST /api/cleaners/payment-method/update
 * 
 * Allows cleaners to update their banking details
 * Only accessible by the cleaner themselves
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCleanerPaymentMethod } from '@/app/services/payouts/jamaicaPayoutService';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check - ensure user is updating their own payment method
    // const session = await getServerSession();
    // const cleanerId = session?.user?.id;
    // if (!cleanerId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { cleanerId, bankName, accountNumber, accountType, whatsappNumber } = body;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Missing cleanerId' },
        { status: 400 }
      );
    }

    // TODO: Verify cleanerId matches authenticated user

    const paymentMethod = await updateCleanerPaymentMethod(cleanerId, {
      bankName,
      accountNumber,
      accountType,
      whatsappNumber,
    });

    return NextResponse.json({
      success: true,
      paymentMethod,
    });
  } catch (error: any) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update payment method' },
      { status: 500 }
    );
  }
}


