export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { findCustomerById } from '@/utils/customerData';
import { getBookingById, canRescheduleBooking } from '@/utils/customerBookings';

/**
 * Update Customer Booking API
 * 
 * PATCH /api/customer/bookings/update
 * 
 * Body: {
 *   bookingId: string,
 *   newDate?: string,
 *   newTimeWindow?: string,
 *   addOns?: string[]
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

export async function PATCH(request: NextRequest) {
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
    const { bookingId, newDate, newTimeWindow, addOns } = body;

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

    // Check if rescheduling is allowed
    if (newDate && !canRescheduleBooking(booking)) {
      return NextResponse.json(
        { success: false, error: 'Rescheduling is only allowed more than 24 hours before the appointment' },
        { status: 400 }
      );
    }

    // Update Stripe session metadata
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(bookingId);
    const metadata = session.metadata || {};

    const updatedMetadata = { ...metadata };

    if (newDate) {
      updatedMetadata.preferredDate = newDate;
      updatedMetadata.customerRescheduled = 'true';
      updatedMetadata.rescheduledAt = new Date().toISOString();
      updatedMetadata.rescheduledBy = 'customer';
    }

    if (newTimeWindow) {
      updatedMetadata.preferredTime = newTimeWindow;
    }

    if (addOns) {
      updatedMetadata.addOns = addOns.join(',');
    }

    // Add admin note
    updatedMetadata.adminNotes = (metadata.adminNotes || '') + 
      `\n\nCustomer rescheduled via portal on ${new Date().toISOString()}`;

    await stripe.checkout.sessions.update(bookingId, {
      metadata: updatedMetadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking: {
        ...booking,
        preferredDate: newDate || booking.preferredDate,
        preferredTime: newTimeWindow || booking.preferredTime,
        addOns: addOns || booking.addOns,
      },
    });
  } catch (error: any) {
    console.error('Update customer booking error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update booking' },
      { status: 500 }
    );
  }
}

