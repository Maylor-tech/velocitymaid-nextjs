export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCustomerSessionToken, COOKIE_NAME } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/customer/me
 * 
 * Get current authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
    const session = await verifyCustomerSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    // Get full customer data
    const fullCustomer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });

    if (!fullCustomer) {
      return NextResponse.json(
        { authenticated: false, error: 'Customer not found' },
        { status: 200 }
      );
    }

    // Access fields that may not be in current Prisma types
    // These fields exist in the schema (addressLine1, city, state, postalCode)
    const customerData = fullCustomer as typeof fullCustomer & {
      addressLine1?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
    };

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: fullCustomer.id,
        firstName: fullCustomer.firstName ?? '',
        lastName: fullCustomer.lastName ?? '',
        email: fullCustomer.email,
        phone: fullCustomer.phone ?? '',
        streetAddress: customerData.addressLine1 ?? fullCustomer.defaultAddress ?? '',
        city: customerData.city ?? '',
        state: customerData.state ?? '',
        zip: customerData.postalCode ?? '',
      },
    });
  } catch (error: any) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch customer',
      },
      { status: 500 }
    );
  }
}
