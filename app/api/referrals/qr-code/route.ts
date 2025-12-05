export const dynamic = 'force-dynamic';

/**
 * Generate Referral QR Code API
 * GET /api/referrals/qr-code?code={referralCode}&format={svg|png}
 * 
 * Returns QR code SVG or PNG for referral link
 */

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const format = searchParams.get('format') || 'svg'; // svg or png

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const referralUrl = `https://velocitymaid.com/ref/${code}`;
    const bookingUrl = `https://velocitymaid.com/booking?branch=new-jersey&ref=${code}`;

    // Generate QR code
    let qrData: string;
    
    if (format === 'png') {
      // Generate PNG data URL
      qrData = await QRCode.toDataURL(bookingUrl, {
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
          'Content-Disposition': `inline; filename="referral-qr-${code}.png"`,
        },
      });
    } else {
      // Generate SVG
      qrData = await QRCode.toString(bookingUrl, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#0A3D2F', // VelocityMaid green
          light: '#FFFFFF',
        },
      });
      
      return new NextResponse(qrData, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="referral-qr-${code}.svg"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Generate QR code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

