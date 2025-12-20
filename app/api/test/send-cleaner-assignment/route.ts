export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { sendCleanerAssignment } from '@/lib/sendCleanerAssignment';

/**
 * Test Endpoint for Manual Cleaner Assignment Notification
 * 
 * Use this endpoint to manually test sending cleaner assignment notifications.
 * 
 * Example usage:
 * POST /api/test/send-cleaner-assignment
 * {
 *   "cleaner": {
 *     "phone": "+1234567890",
 *     "name": "John Cleaner"
 *   },
 *   "booking": {
 *     "customerName": "Jane D",
 *     "serviceType": "basic",
 *     "preferredDate": "2024-12-26",
 *     "preferredTime": "10:00 AM",
 *     "address": "123 Main Street, Newark, NJ 07102"
 *   }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cleaner, booking } = body;

    // Validate required fields
    if (!cleaner || !cleaner.phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: cleaner.phone',
        },
        { status: 400 }
      );
    }

    if (!booking || !booking.customerName || !booking.serviceType || !booking.preferredDate || !booking.address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required booking fields: customerName, serviceType, preferredDate, and address are required',
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

    console.log(`[TEST] Sending cleaner assignment to ${cleaner.phone}`);
    console.log(`[TEST] Cleaner: ${cleaner.name || 'Unknown'}, Customer: ${booking.customerName}`);

    // Send cleaner assignment
    const result = await sendCleanerAssignment(
      whatsappPhoneNumberId,
      whatsappToken,
      {
        phone: cleaner.phone,
        name: cleaner.name,
      },
      {
        customerName: booking.customerName,
        serviceType: booking.serviceType,
        preferredDate: booking.preferredDate,
        preferredTime: booking.preferredTime || 'Morning',
        address: booking.address,
      }
    );

    if (result.success) {
      console.log(`[TEST] SUCCESS: Cleaner assignment sent (Message ID: ${result.messageId})`);
      return NextResponse.json({
        success: true,
        message: 'Cleaner assignment notification sent successfully',
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
    console.error('[TEST] Error sending cleaner assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send cleaner assignment',
      },
      { status: 500 }
    );
  }
}

// Support GET for quick testing with query parameters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const cleanerPhone = searchParams.get('cleanerPhone');
  const cleanerName = searchParams.get('cleanerName') || 'Test Cleaner';
  const customerName = searchParams.get('customerName') || 'John D';
  const serviceType = searchParams.get('serviceType') || 'basic';
  const preferredDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const preferredTime = searchParams.get('time') || '10:00 AM';
  const address = searchParams.get('address') || '123 Main Street, Newark, NJ 07102';

  if (!cleanerPhone) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing cleanerPhone parameter. Usage: /api/test/send-cleaner-assignment?cleanerPhone=+1234567890&customerName=John D&serviceType=basic&date=2024-12-26&time=10:00 AM&address=123 Main St',
        example: '/api/test/send-cleaner-assignment?cleanerPhone=+1234567890&customerName=John D&serviceType=basic&date=2024-12-26&time=10:00 AM&address=123 Main St',
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

  try {
    const result = await sendCleanerAssignment(
      whatsappPhoneNumberId,
      whatsappToken,
      {
        phone: cleanerPhone,
        name: cleanerName,
      },
      {
        customerName,
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




