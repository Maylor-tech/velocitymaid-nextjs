export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { findCustomerById } from '@/utils/customerData';
import { getBookingById, canCancelBooking } from '@/utils/customerBookings';

/**
 * Cancel Customer Booking API
 * 
 * POST /api/customer/bookings/cancel
 * 
 * Body: {
 *   bookingId: string,
 *   reason?: string
 * }
 */
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const customerId = cookieStore.get('customerId')?.value;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customer = findCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Get booking and verify ownership
    const booking = await getBookingById(bookingId, customer.email);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    // Check if cancellation is allowed
    if (!canCancelBooking(booking)) {
      return NextResponse.json(
        { success: false, error: 'Cancellation is only allowed more than 24 hours before the appointment or for pending bookings' },
        { status: 400 }
      );
    }

    // Update Stripe session metadata
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(bookingId);
    const metadata = session.metadata || {};

    const updatedMetadata = {
      ...metadata,
      status: 'cancelled_by_customer',
      cancelled: 'true',
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'customer',
      cancellationReason: reason || 'No reason provided',
      adminNotes: (metadata.adminNotes || '') + 
        `\n\nCustomer cancelled via portal on ${new Date().toISOString()}. Reason: ${reason || 'No reason provided'}`,
    };

    await stripe.checkout.sessions.update(bookingId, {
      metadata: updatedMetadata,
    });

    // TODO: Send WhatsApp alert to admin
    // TODO: Send email alert to admin
    // await sendAdminCancellationAlert(booking, customer, reason);

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        ...booking,
        status: 'cancelled_by_customer',
        cancelledAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Cancel customer booking error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}

