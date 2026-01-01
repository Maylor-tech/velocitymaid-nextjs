export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Share Referral Link API
 * GET /api/referrals/share?customerId={id}&method={whatsapp|sms|copy}
 * 
 * Returns shareable referral link and formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const method = searchParams.get('method') || 'copy';

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get or create referral link
    let referralLink = await prisma.referralLink.findFirst({
      where: {
        customerId,
        isActive: true,
      },
      include: {
        branch: true,
        customer: true,
      },
    });

    if (!referralLink) {
      // Create referral link if it doesn't exist
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { branch: true },
      });

      if (!customer || !customer.branchId) {
        return NextResponse.json(
          { success: false, error: 'Customer or branch not found' },
          { status: 404 }
        );
      }

      const branchPrefix = customer.branch?.slug === 'new-jersey' ? 'NJ' : 'VM';
      const code = `${branchPrefix}-${customerId.substring(0, 8).toUpperCase()}`;

      referralLink = await prisma.referralLink.create({
        data: {
          customerId,
          branchId: customer.branchId,
          code,
          isActive: true,
        },
        include: {
          branch: true,
          customer: true,
        },
      });
    }

    const baseUrl = 'https://velocitymaid.com';
    const referralUrl = `${baseUrl}/ref/${referralLink.code}`;
    const bookingUrl = `${baseUrl}/booking?branch=${referralLink.branch.slug}&ref=${referralLink.code}`;

    // Format message based on method
    let shareMessage = '';
    let shareUrl = '';

    switch (method) {
      case 'whatsapp':
        shareMessage = `Hi! I've been using VelocityMaid for cleaning services and love them. Get $20 off your first clean when you use my referral link: ${bookingUrl}`;
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'sms':
        shareMessage = `Get $20 off your first VelocityMaid cleaning! Use my referral link: ${bookingUrl}`;
        shareUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
        break;
      default:
        shareMessage = referralUrl;
        shareUrl = referralUrl;
    }

    return NextResponse.json({
      success: true,
      referralLink: {
        code: referralLink.code,
        url: referralUrl,
        bookingUrl: bookingUrl,
      },
      share: {
        method,
        message: shareMessage,
        url: shareUrl,
      },
    });
  } catch (error: any) {
    console.error('Share referral link error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get share link' },
      { status: 500 }
    );
  }
}

