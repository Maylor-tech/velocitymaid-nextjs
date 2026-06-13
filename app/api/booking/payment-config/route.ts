import { NextResponse } from 'next/server';
import {
  getBookingDepositCents,
  getBookingDepositDollars,
  getBookingPaymentMode,
  isDepositBookingMode,
} from '@/lib/booking/paymentConfig';

export const dynamic = 'force-dynamic';

/**
 * GET /api/booking/payment-config
 * Runtime payment mode for booking UI (reads server env on Vercel without rebuild).
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    mode: getBookingPaymentMode(),
    depositMode: isDepositBookingMode(),
    depositDollars: getBookingDepositDollars(),
    depositCents: getBookingDepositCents(),
  });
}
