import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getCustomerBookings, getUpcomingBookings, getBookingHistory } from '@/utils/customerBookings';

/**
 * List Customer Bookings API
 * 
 * GET /api/customer/bookings/list?type=upcoming|history|all
 * 
 * Returns: List of customer bookings
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';

    let bookings;

    switch (type) {
      case 'upcoming':
        bookings = await getUpcomingBookings(customer.email);
        break;
      case 'history':
        bookings = await getBookingHistory(customer.email);
        break;
      default:
        bookings = await getCustomerBookings(customer.email);
    }

    return NextResponse.json({
      success: true,
      bookings,
      count: bookings.length,
    });
  } catch (error: any) {
    console.error('List customer bookings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

