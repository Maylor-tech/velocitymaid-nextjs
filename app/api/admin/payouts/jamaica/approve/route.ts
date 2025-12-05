export const dynamic = 'force-dynamic'

/**
 * Approve Jamaica Payout API
 * POST /api/admin/payouts/jamaica/approve
 * 
 * Marks a payout as APPROVED and sends WhatsApp notification
 * Only accessible by ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { markPayoutApproved, getCleanerPaymentMethod } from '@/app/services/payouts/jamaicaPayoutService';
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

    // Mark payout as approved
    const payout = await markPayoutApproved(payoutId);

    // Send WhatsApp notification (non-blocking)
    try {
      const cleaner = payout.cleaner;
      const paymentMethod = await getCleanerPaymentMethod(payout.cleanerId);

      const whatsappNumber = paymentMethod?.whatsappNumber || null;
      if (whatsappNumber) {
        const message = `Your payout of JMD $${payout.totalAmount.toLocaleString()} has been APPROVED.\n\nPayment will be processed shortly.`;

        await sendWhatsAppMessage(whatsappNumber, message);
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      // Don't fail the approval if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      payout,
    });
  } catch (error: any) {
    console.error('Approve payout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve payout' },
      { status: 500 }
    );
  }
}

