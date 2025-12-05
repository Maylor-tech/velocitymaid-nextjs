export const dynamic = 'force-dynamic';

/**
 * Send Referral WhatsApp Message API
 * POST /api/automations/referrals/send-whatsapp
 * 
 * Sends WhatsApp message to customer about referral program
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, messageType, jobId } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        referralLinks: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!customer || !customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer or phone number not found' },
        { status: 404 }
      );
    }

    // Get or create referral link
    let referralLink = customer.referralLinks[0];
    if (!referralLink) {
      const branchPrefix = customer.branch?.slug === 'new-jersey' ? 'NJ' : 'VM';
      const code = `${branchPrefix}-${customerId.substring(0, 8).toUpperCase()}`;
      
      referralLink = await prisma.referralLink.create({
        data: {
          customerId,
          branchId: customer.branchId!,
          code,
          isActive: true,
        },
      });
    }

    const referralUrl = `https://velocitymaid.com/ref/${referralLink.code}`;
    const bookingUrl = `https://velocitymaid.com/booking?branch=${customer.branch?.slug}&ref=${referralLink.code}`;

    // Generate message based on type
    let message = '';
    if (messageType === 'booking_complete') {
      message = `🎉 Thank you for choosing VelocityMaid! 

Love our service? Refer a friend and you both get $20 off!

Your referral link: ${bookingUrl}

Share with friends and earn $20 credit for each referral that books!`;
    } else if (messageType === 'reminder') {
      message = `💡 Don't forget! You can earn $20 for every friend you refer to VelocityMaid.

Your referral link: ${bookingUrl}

Share now and start earning credits!`;
    } else {
      message = `👋 Welcome to VelocityMaid! 

Refer a friend and you both get $20 off your next cleaning!

Your referral link: ${bookingUrl}

Share with friends and earn rewards!`;
    }

    // In production, send via WhatsApp service
    // For now, return success (integration with whatsappService would go here)
    console.log('WhatsApp message (would send):', {
      to: customer.phone,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message queued',
      referralLink: {
        code: referralLink.code,
        url: referralUrl,
      },
    });
  } catch (error: any) {
    console.error('Send referral WhatsApp error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}

