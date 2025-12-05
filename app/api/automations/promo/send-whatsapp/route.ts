export const dynamic = 'force-dynamic';

/**
 * Send Promo WhatsApp Message
 * POST /api/automations/promo/send-whatsapp
 * 
 * Sends monthly promo WhatsApp message to active customers
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, promoId, customerIds } = body;

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

    // Get active customers for this branch
    let customers;
    if (customerIds && Array.isArray(customerIds)) {
      customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
          branchId,
          whatsappOptIn: true,
          phone: { not: null },
        },
      });
    } else {
      // Get all active customers who have booked before
      customers = await prisma.customer.findMany({
        where: {
          branchId,
          whatsappOptIn: true,
          phone: { not: null },
          leadStatus: { in: ['BOOKED', 'ACTIVE'] },
        },
      });
    }

    const discountText = promo.discountType === 'percent'
      ? `${promo.discountValue}% OFF`
      : `$${promo.discountValue} OFF`;

    const message = `🎉 ${promo.title}!

${promo.description}

Get ${discountText} on your next cleaning!

Book now: https://velocitymaid.com/booking?branch=${promo.branch.slug}&promo=${promo.month}-${promo.year}

Valid until ${new Date(promo.endDate).toLocaleDateString()}`;

    let sentCount = 0;
    let failedCount = 0;

    for (const customer of customers) {
      if (!customer.phone) continue;

      try {
        const result = await sendWhatsAppMessage(customer.phone, message);
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to send WhatsApp to ${customer.phone}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} promo messages`,
      sentCount,
      failedCount,
      totalCustomers: customers.length,
    });
  } catch (error: any) {
    console.error('Send promo WhatsApp error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send promo messages' },
      { status: 500 }
    );
  }
}

