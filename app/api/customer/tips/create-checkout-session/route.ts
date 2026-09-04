export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getOrCreateStripeCustomerForCustomer } from '@/utils/getOrCreateStripeCustomerForCustomer';
import { createTip } from '@/utils/tipData';
import { getStripe } from '@/utils/stripe';

/**
 * Create Tip Checkout Session API
 * 
 * POST /api/customer/tips/create-checkout-session
 * 
 * Body: {
 *   jobId: string,
 *   cleanerId: string,
 *   tipAmount: number
 * }
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

    const body = await request.json();
    const { jobId, cleanerId, tipAmount } = body;

    // Validate tip amount
    if (!tipAmount || tipAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Tip amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (tipAmount > 1000) {
      return NextResponse.json(
        { success: false, error: 'Tip amount cannot exceed $1000' },
        { status: 400 }
      );
    }

    const stripeCustomerId = await getOrCreateStripeCustomerForCustomer(customer);
    const stripe = getStripe();

    // Get origin for return URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/customer/tips?status=success`;
    const cancelUrl = `${origin}/customer/tips?status=cancel`;

    // Create Stripe Checkout Session for tip
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for cleaning job ${jobId.substring(0, 12)}...`,
              description: 'Thank you for supporting your cleaner!',
            },
            unit_amount: Math.round(tipAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customerId,
        jobId,
        cleanerId,
        tipAmount: tipAmount.toString(),
        type: 'tip',
      },
    });

    // Create tip record (pending status)
    const tip = createTip({
      jobId,
      cleanerId,
      customerId,
      tipAmount,
      stripePaymentIntentId: null,
      status: 'pending',
    });

    // TODO: Update tip status via webhook when payment succeeds
    // Webhook should:
    // 1. Listen for checkout.session.completed event
    // 2. Find tip by jobId or metadata
    // 3. Update tip status to 'paid'
    // 4. Set stripePaymentIntentId
    // 5. Call addPointsForTip() from loyalty engine

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      tipId: tip.id,
    });
  } catch (error: unknown) {
    console.error('Create tip checkout error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create tip checkout session' },
      { status: 500 }
    );
  }
}

