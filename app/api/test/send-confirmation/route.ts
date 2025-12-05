export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { sendCustomerConfirmation } from '@/lib/sendCustomerConfirmation';

/**
 * Test Endpoint for Manual WhatsApp Confirmation
 * 
 * Use this endpoint to manually test sending WhatsApp confirmations.
 * 
 * Example usage:
 * POST /api/test/send-confirmation
 * {
 *   "phone": "+1234567890",
 *   "serviceType": "basic",
 *   "preferredDate": "2024-12-26",
 *   "preferredTime": "10:00 AM",
 *   "address": "123 Main Street, Newark, NJ 07102"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phone,
      firstName = 'John',
      lastInitial = 'D',
      serviceType,
      preferredDate,
      preferredTime,
      address,
    } = body;

    // Validate required fields
    if (!phone || !serviceType || !preferredDate || !address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: phone, serviceType, preferredDate, and address are required',
        },
        { status: 400 }
      );
    }

    // Get WhatsApp credentials
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !whatsappPhoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp credentials not configured. Please set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables.',
        },
        { status: 500 }
      );
    }

    console.log(`[TEST] Sending WhatsApp confirmation to ${phone}`);

    // Send confirmation
    const result = await sendCustomerConfirmation(
      whatsappPhoneNumberId,
      whatsappToken,
      {
        firstName,
        lastInitial,
        phone,
        serviceType,
        preferredDate,
        preferredTime: preferredTime || 'Morning',
        address,
      }
    );

    if (result.success) {
      console.log(`[TEST] SUCCESS: Confirmation sent (Message ID: ${result.messageId})`);
      return NextResponse.json({
        success: true,
        message: 'WhatsApp confirmation sent successfully',
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`[TEST] FAILED: ${result.error}`);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[TEST] Error sending confirmation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send confirmation',
      },
      { status: 500 }
    );
  }
}

// Support GET for quick testing with query parameters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const phone = searchParams.get('phone');
  const serviceType = searchParams.get('serviceType') || 'basic';
  const preferredDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const preferredTime = searchParams.get('time') || '10:00 AM';
  const address = searchParams.get('address') || '123 Test Street, Test City, ST 12345';

  if (!phone) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing phone parameter. Usage: /api/test/send-confirmation?phone=+1234567890&serviceType=basic&date=2024-12-26&time=10:00 AM&address=123 Main St',
        example: '/api/test/send-confirmation?phone=+1234567890&serviceType=basic&date=2024-12-26&time=10:00 AM&address=123 Main St',
      },
      { status: 400 }
    );
  }

  // Get WhatsApp credentials
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !whatsappPhoneNumberId) {
    return NextResponse.json(
      {
        success: false,
        error: 'WhatsApp credentials not configured',
      },
      { status: 500 }
    );
  }

  // Extract firstName and lastInitial from query params or use defaults
  const firstName = searchParams.get('firstName') || 'John';
  const lastInitial = searchParams.get('lastInitial') || 'D';

  try {
    const result = await sendCustomerConfirmation(
      whatsappPhoneNumberId,
      whatsappToken,
      {
        firstName,
        lastInitial,
        phone,
        serviceType,
        preferredDate,
        preferredTime,
        address,
      }
    );

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

