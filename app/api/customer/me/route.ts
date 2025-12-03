import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';

/**
 * Get Current Customer API
 * 
 * GET /api/customer/me
 * 
 * Returns current logged-in customer info
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

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        defaultAddress: customer.defaultAddress,
        region: customer.region,
      },
    });
  } catch (error: any) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

