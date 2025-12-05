export const dynamic = 'force-dynamic';

/**
 * Send Referral SMS Message API
 * POST /api/automations/referrals/send-sms
 * 
 * Sends SMS message to customer about referral program
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, messageType } = body;

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

    const bookingUrl = `https://velocitymaid.com/booking?branch=${customer.branch?.slug}&ref=${referralLink.code}`;

    // Generate message
    let message = '';
    if (messageType === 'booking_complete') {
      message = `Thank you for choosing VelocityMaid! Refer a friend and you both get $20 off. Your link: ${bookingUrl}`;
    } else {
      message = `Earn $20 for every friend you refer to VelocityMaid! Share: ${bookingUrl}`;
    }

    // In production, send via SMS service
    // For now, return success
    console.log('SMS message (would send):', {
      to: customer.phone,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'SMS message queued',
      referralLink: {
        code: referralLink.code,
        url: bookingUrl,
      },
    });
  } catch (error: any) {
    console.error('Send referral SMS error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send SMS message' },
      { status: 500 }
    );
  }
}

