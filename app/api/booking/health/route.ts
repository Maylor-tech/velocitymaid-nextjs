import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint for booking API
 * Use this to verify the route is accessible
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'booking-api',
    timestamp: new Date().toISOString(),
    message: 'Booking API is accessible'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      status: 'ok',
      service: 'booking-api',
      received: body,
      timestamp: new Date().toISOString(),
      message: 'Booking API received POST request successfully'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

