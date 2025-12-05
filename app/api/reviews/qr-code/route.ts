export const dynamic = 'force-dynamic';

/**
 * Generate Review QR Code
 * GET /api/reviews/qr-code?branch=new-jersey
 * 
 * Generates QR code for review page
 */

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get('branch') || 'new-jersey';

    // Branch-aware: Only generate for NJ
    if (branch !== 'new-jersey') {
      return NextResponse.json(
        { success: false, error: 'QR codes only available for New Jersey branch' },
        { status: 400 }
      );
    }

    const reviewUrl = `https://velocitymaid.com/review-us/new-jersey`;

    // Generate PNG QR code
    const qrData = await QRCode.toDataURL(reviewUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0A3D2F', // VelocityMaid green
        light: '#FFFFFF',
      },
    });

    // Convert data URL to buffer
    const base64Data = qrData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="review-qr-nj.png"',
      },
    });
  } catch (error: any) {
    console.error('Generate review QR code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

