export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { resolveMarketSupportForCustomer } from '@/lib/customer/marketSupport';
import {
  isCustomerPortalEmailBlocked,
  customerPortalBlockedMessage,
} from '@/lib/customer/portalAccess';
import { resolveAuthenticatedBookingCta } from '@/lib/customer/requestCleaningCta';

/**
 * Get Current Customer API
 *
 * GET /api/customer/me
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
        isBlocked: true,
        defaultAddress: true,
        addressLine1: true,
        city: true,
        state: true,
        billingPolicy: true,
        Property: { select: { id: true }, take: 2, orderBy: { createdAt: 'asc' } },
        Branch: {
          select: {
            slug: true,
            state: true,
            name: true,
            regionLabel: true,
            primaryPhone: true,
            whatsappNumber: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (
      customer.isBlocked ||
      isCustomerPortalEmailBlocked(customer.email)
    ) {
      return NextResponse.json(
        { success: false, error: customerPortalBlockedMessage(), blocked: true },
        { status: 403 }
      );
    }

    const support = resolveMarketSupportForCustomer(customer);
    const addressLine =
      customer.defaultAddress ||
      [customer.addressLine1, customer.city, customer.state].filter(Boolean).join(', ') ||
      null;

    const properties = customer.Property ?? [];
    const bookingCta = resolveAuthenticatedBookingCta({
      propertyCount: properties.length >= 2 ? 2 : properties.length,
      firstPropertyId: properties[0]?.id ?? null,
    });

    return NextResponse.json({
      success: true,
      authenticated: true,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        homeZipCode: customer.homeZipCode,
        branchId: customer.branchId,
        address: addressLine,
        marketLabel: support.marketLabel,
        billingPolicy: customer.billingPolicy,
      },
      bookingCta,
      support,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch customer';
    console.error('Get customer error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
