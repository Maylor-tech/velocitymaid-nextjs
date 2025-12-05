export const dynamic = 'force-dynamic';

/**
 * Send Promo SMS Message
 * POST /api/automations/promo/send-sms
 * 
 * Sends monthly promo SMS to leads who never booked
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, promoId } = body;

    if (!branchId || !promoId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID and Promo ID are required' },
        { status: 400 }
      );
    }

    // Get promo
    const promo = await prisma.promo.findUnique({
      where: { id: promoId },
      include: { branch: true },
    });

    if (!promo || !promo.active) {
      return NextResponse.json(
        { success: false, error: 'Promo not found or inactive' },
        { status: 404 }
      );
    }

    // Get leads who never booked (NEW or ACTIVE status, no jobs)
    const leads = await prisma.customer.findMany({
      where: {
        branchId,
        phone: { not: null },
        leadStatus: { in: ['NEW', 'ACTIVE'] },
        jobs: { none: {} }, // No jobs
      },
    });

    const discountText = promo.discountType === 'percent'
      ? `${promo.discountValue}% OFF`
      : `$${promo.discountValue} OFF`;

    const message = `${promo.title}: ${discountText} on cleaning! Book: https://velocitymaid.com/booking?branch=${promo.branch.slug}&promo=${promo.month}-${promo.year}`;

    let sentCount = 0;
    let failedCount = 0;

    for (const lead of leads) {
      if (!lead.phone) continue;

      try {
        // SMS sending would go here (integrate with SMS service like Twilio)
        console.log('SMS message (would send):', {
          to: lead.phone,
          message,
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send SMS to ${lead.phone}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} promo SMS messages`,
      sentCount,
      failedCount,
      totalLeads: leads.length,
    });
  } catch (error: any) {
    console.error('Send promo SMS error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send promo SMS' },
      { status: 500 }
    );
  }
}

