export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '../../../../lib/customerSession';
import { prisma } from '../../../../lib/prisma';

/**
 * Get Current Customer API
 * 
 * GET /api/customer/me
 * 
 * Returns current logged-in customer info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch customer from database
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        homeZipCode: true,
        branchId: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true, // ✅ Add this for CustomerLayout compatibility
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        homeZipCode: customer.homeZipCode,
        branchId: customer.branchId,
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

