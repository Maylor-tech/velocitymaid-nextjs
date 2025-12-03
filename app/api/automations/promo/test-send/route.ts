/**
 * Test Send Promo Message
 * POST /api/automations/promo/test-send
 * 
 * Sends test promo message to admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, channel, message } = body;

    if (!branchId || !channel || !message) {
      return NextResponse.json(
        { success: false, error: 'Branch ID, channel, and message are required' },
        { status: 400 }
      );
    }

    // Get admin/test phone from env or use default
    const testPhone = process.env.ADMIN_TEST_PHONE || process.env.WHATSAPP_TEST_PHONE;

    if (!testPhone) {
      return NextResponse.json(
        { success: false, error: 'Test phone number not configured' },
        { status: 400 }
      );
    }

    if (channel === 'whatsapp') {
      const result = await sendWhatsAppMessage(testPhone, message);
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Test WhatsApp message sent',
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to send test message',
        }, { status: 500 });
      }
    } else if (channel === 'sms') {
      // SMS sending would go here
      console.log('Test SMS (would send):', {
        to: testPhone,
        message,
      });
      return NextResponse.json({
        success: true,
        message: 'Test SMS message queued',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid channel. Use "whatsapp" or "sms"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Test send promo error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send test message' },
      { status: 500 }
    );
  }
}

