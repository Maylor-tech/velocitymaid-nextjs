export const dynamic = 'force-dynamic'

/**
 * Mark Jamaica Payout as Paid API
 * POST /api/admin/payouts/jamaica/paid
 * 
 * Marks a payout as PAID and sends WhatsApp receipt
 * Only accessible by ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { markPayoutPaid, getCleanerPaymentMethod } from '@/app/services/payouts/jamaicaPayoutService';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { payoutId } = body;

    if (!payoutId) {
      return NextResponse.json(
        { success: false, error: 'Missing payoutId' },
        { status: 400 }
      );
    }

    // Mark payout as paid
    const payout = await markPayoutPaid(payoutId);

    // Send WhatsApp notification (non-blocking)
    try {
      const cleaner = payout.cleaner;
      const paymentMethod = await getCleanerPaymentMethod(payout.cleanerId);

      const whatsappNumber = paymentMethod?.whatsappNumber || null;
      if (whatsappNumber) {
        const message = `Your payout of JMD $${payout.totalAmount.toLocaleString()} has been PAID 🎉\n\nThank you for your excellent work!`;

        await sendWhatsAppMessage(whatsappNumber, message);
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      // Don't fail the payment marking if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      payout,
    });
  } catch (error: any) {
    console.error('Mark payout paid error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark payout as paid' },
      { status: 500 }
    );
  }
}

