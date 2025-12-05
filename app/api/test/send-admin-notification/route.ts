export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/sendAdminNotification';

/**
 * Test Endpoint for Manual Admin Notification
 * 
 * Use this endpoint to manually test sending admin notifications.
 * 
 * Example usage:
 * POST /api/test/send-admin-notification
 * {
 *   "customerName": "John D",
 *   "serviceType": "basic",
 *   "totalPrice": 120,
 *   "address": "123 Main Street, Newark, NJ 07102",
 *   "preferredDate": "2024-12-26"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      serviceType,
      totalPrice,
      address,
      preferredDate,
    } = body;

    // Validate required fields
    if (!customerName || !serviceType || !address || !preferredDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: customerName, serviceType, address, and preferredDate are required',
        },
        { status: 400 }
      );
    }

    if (totalPrice === undefined || totalPrice === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'totalPrice is required',
        },
        { status: 400 }
      );
    }

    // Get WhatsApp credentials
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const serviceLocation = body.serviceLocation || 'new_jersey'; // Default to NJ

    if (!whatsappToken || !whatsappPhoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp credentials not configured. Please set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables.',
        },
        { status: 500 }
      );
    }

    console.log(`[TEST] Sending admin notification for ${serviceLocation}`);
    console.log(`[TEST] Customer: ${customerName}, Service: ${serviceType}, Amount: $${totalPrice}`);

    // Send admin notification (routing handled inside function)
    const result = await sendAdminNotification(
      whatsappPhoneNumberId,
      whatsappToken,
      {
        customerName,
        serviceType,
        totalPrice,
        address,
        preferredDate,
        serviceLocation,
      }
    );

    if (result.success) {
      console.log(`[TEST] SUCCESS: Admin notification sent (Message ID: ${result.messageId})`);
      return NextResponse.json({
        success: true,
        message: 'Admin notification sent successfully',
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
    console.error('[TEST] Error sending admin notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send admin notification',
      },
      { status: 500 }
    );
  }
}

// Support GET for quick testing with query parameters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const customerName = searchParams.get('customerName') || 'John D';
  const serviceType = searchParams.get('serviceType') || 'basic';
  const totalPrice = parseFloat(searchParams.get('totalPrice') || '120');
  const address = searchParams.get('address') || '123 Main Street, Newark, NJ 07102';
  const preferredDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const serviceLocation = searchParams.get('serviceLocation') || 'new_jersey';

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

  try {
    const result = await sendAdminNotification(
      whatsappPhoneNumberId,
      whatsappToken,
      {
        customerName,
        serviceType,
        totalPrice,
        address,
        preferredDate,
        serviceLocation,
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

