export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getOrCreateStripeCustomerForCustomer } from '@/utils/getOrCreateStripeCustomerForCustomer';
import { getStripe } from '@/utils/stripe';

/**
 * Create Billing Portal Session API
 *
 * POST /api/customer/billing/portal
 *
 * Creates a Stripe Billing Portal session and returns the URL
 */
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

    const stripeCustomerId = await getOrCreateStripeCustomerForCustomer(customer);

    const returnUrl = process.env.STRIPE_BILLING_PORTAL_RETURN_URL ||
                     `${request.headers.get('origin') || 'http://localhost:3000'}/customer/billing`;

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error: unknown) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create billing portal session',
      },
      { status: 500 }
    );
  }
}
