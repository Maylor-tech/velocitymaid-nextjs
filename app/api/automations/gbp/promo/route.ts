/**
 * Google Business Profile Promo Post (Optional)
 * POST /api/automations/gbp/promo
 * 
 * Automatically posts promo to Google Business Profile
 */

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

    const discountText = promo.discountType === 'percent'
      ? `${promo.discountValue}% OFF`
      : `$${promo.discountValue} OFF`;

    // Create post content
    const postContent = {
      summary: `${promo.title}: ${discountText}`,
      callToAction: {
        actionType: 'BOOK',
        url: `https://velocitymaid.com/booking?branch=${promo.branch.slug}&promo=${promo.month}-${promo.year}`,
      },
      media: {
        mediaFormat: 'PHOTO',
        sourceUrl: 'https://velocitymaid.com/cleaning/clean-kitchen.jpg', // Default image
      },
    };

    // In production, integrate with Google Business Profile API
    // For now, log the post content
    console.log('Google Business Profile post (would create):', {
      locationId: process.env.GBP_LOCATION_ID,
      postContent,
    });

    // Example integration (would need Google Business Profile API credentials):
    // const response = await fetch(`https://mybusiness.googleapis.com/v4/locations/${locationId}/localPosts`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(postContent),
    // });

    return NextResponse.json({
      success: true,
      message: 'Promo post queued for Google Business Profile',
      postContent,
    });
  } catch (error: any) {
    console.error('GBP promo post error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create GBP post' },
      { status: 500 }
    );
  }
}

