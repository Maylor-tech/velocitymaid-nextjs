/**
 * Create Jamaica Payout API
 * POST /api/admin/payouts/jamaica/create
 * 
 * Creates a payout for a cleaner in a Jamaica branch
 * Only accessible by ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPayout } from '@/app/services/payouts/jamaicaPayoutService';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { cleanerId, branchId, periodStart, periodEnd, notes } = body;

    if (!cleanerId || !branchId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: cleanerId, branchId, periodStart, periodEnd' },
        { status: 400 }
      );
    }

    // Create payout
    const payout = await createPayout(
      cleanerId,
      branchId,
      new Date(periodStart),
      new Date(periodEnd),
      notes
    );

    // Send WhatsApp notification (non-blocking)
    try {
      const cleaner = payout.cleaner;
      const paymentMethod = await import('@/app/services/payouts/jamaicaPayoutService').then(
        (m) => m.getCleanerPaymentMethod(cleanerId)
      );

      const whatsappNumber = paymentMethod?.whatsappNumber || null;
      if (whatsappNumber) {
        const periodStartFormatted = new Date(periodStart).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const periodEndFormatted = new Date(periodEnd).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const message = `Hi ${cleaner.name || 'there'}, your payout for ${periodStartFormatted} – ${periodEndFormatted} has been created:\n\nAmount: JMD $${payout.totalAmount.toLocaleString()}\nStatus: Pending approval`;

        await sendWhatsAppMessage(whatsappNumber, message);
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      // Don't fail the payout creation if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      payout,
    });
  } catch (error: any) {
    console.error('Create payout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payout' },
      { status: 500 }
    );
  }
}

