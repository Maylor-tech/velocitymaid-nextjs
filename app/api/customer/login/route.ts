import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerByEmail, findOrCreateCustomerFromEmail } from '@/utils/customerData';
import { getCustomerBookings } from '@/utils/customerBookings';

/**
 * Customer Login API
 * 
 * POST /api/customer/login
 * 
 * Body: { email: string }
 * 
 * Simple email-based auth (Phase 1)
 * TODO: Replace with magic-link email auth in future
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Try to find existing customer
    let customer = findCustomerByEmail(normalizedEmail);

    // If not found, check if there are bookings with this email
    if (!customer) {
      const bookings = await getCustomerBookings(normalizedEmail);
      
      if (bookings.length > 0) {
        // Create customer from booking data
        const firstBooking = bookings[0];
        const nameParts = firstBooking.customerName.split(' ');
        
        customer = await findOrCreateCustomerFromEmail(normalizedEmail);
        
        // Update customer with booking data if available
        if (customer && firstBooking) {
          // Update phone and address from booking if not set
          // This would be done via updateCustomer if needed
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No account found with this email. Please book a service first or contact support.' 
          },
          { status: 404 }
        );
      }
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Failed to create customer account' },
        { status: 500 }
      );
    }

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('customerId', customer.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error: any) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to login' },
      { status: 500 }
    );
  }
}

