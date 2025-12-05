export const dynamic = 'force-dynamic';

/**
 * Monthly Promo Scheduler (Cron Job)
 * GET /api/cron/promo/monthly-send
 * 
 * Runs on 1st of each month at 9am EST
 * Sends promo messages to customers
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Get active promos for current month
    const promos = await prisma.promo.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { branch: true },
    });

    let totalSent = 0;
    let totalFailed = 0;

    for (const promo of promos) {
      // Send WhatsApp to active customers
      try {
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/promo/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchId: promo.branchId,
            promoId: promo.id,
          }),
        });

        const whatsappData = await whatsappResponse.json();
        if (whatsappData.success) {
          totalSent += whatsappData.sentCount || 0;
          totalFailed += whatsappData.failedCount || 0;
        }
      } catch (error) {
        console.error(`Failed to send WhatsApp for promo ${promo.id}:`, error);
      }

      // Send SMS to leads
      try {
        const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/promo/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchId: promo.branchId,
            promoId: promo.id,
          }),
        });

        const smsData = await smsResponse.json();
        if (smsData.success) {
          totalSent += smsData.sentCount || 0;
          totalFailed += smsData.failedCount || 0;
        }
      } catch (error) {
        console.error(`Failed to send SMS for promo ${promo.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${promos.length} promos`,
      totalSent,
      totalFailed,
      promosProcessed: promos.length,
    });
  } catch (error: any) {
    console.error('Monthly promo scheduler error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process monthly promos' },
      { status: 500 }
    );
  }
}

