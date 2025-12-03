/**
 * Get Cleaner Payment Method API
 * GET /api/cleaners/payment-method/get?cleanerId=xxx
 * 
 * Gets cleaner's payment method details
 * Only accessible by the cleaner themselves or ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCleanerPaymentMethod } from '@/app/services/payouts/jamaicaPayoutService';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    const searchParams = request.nextUrl.searchParams;
    const cleanerId = searchParams.get('cleanerId');

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Missing cleanerId parameter' },
        { status: 400 }
      );
    }

    // TODO: Verify cleanerId matches authenticated user or user is ADMIN

    const paymentMethod = await getCleanerPaymentMethod(cleanerId);

    return NextResponse.json({
      success: true,
      paymentMethod,
    });
  } catch (error: any) {
    console.error('Get payment method error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get payment method' },
      { status: 500 }
    );
  }
}

