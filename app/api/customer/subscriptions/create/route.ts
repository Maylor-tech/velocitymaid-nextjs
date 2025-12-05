export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getOrCreateStripeCustomerForCustomer } from '@/utils/getOrCreateStripeCustomerForCustomer';
import { createSubscription } from '@/utils/subscriptionData';
import stripe from '@/utils/stripe';
import type { PlanType } from '@/utils/subscriptionData';

/**
 * Create Subscription Checkout Session API
 * 
 * POST /api/customer/subscriptions/create
 * 
 * Body: {
 *   planType: "weekly" | "biweekly" | "monthly",
 *   serviceLocation: "new_jersey" | "vermont",
 *   defaultServiceType: "basic" | "deep" | "moveInOut",
 *   defaultAddOns?: string[]
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
    const { planType, serviceLocation, defaultServiceType, defaultAddOns = [] } = body;

    // Validate planType
    const validPlanTypes: PlanType[] = ['weekly', 'biweekly', 'monthly'];
    if (!validPlanTypes.includes(planType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Map planType to Stripe price ID
    const priceIdMap: Record<PlanType, string> = {
      weekly: process.env.STRIPE_PRICE_WEEKLY || '',
      biweekly: process.env.STRIPE_PRICE_BIWEEKLY || '',
      monthly: process.env.STRIPE_PRICE_MONTHLY || '',
    };

    const priceId = priceIdMap[planType as PlanType];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: `Price ID not configured for ${planType} plan` },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomerForCustomer(customer);

    // Get origin for return URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/customer/subscriptions?status=success`;
    const cancelUrl = `${origin}/customer/subscriptions?status=cancel`;

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customerId,
        planType,
        serviceLocation,
        defaultServiceType,
        defaultAddOns: defaultAddOns.join(','),
      },
    });

    // TODO: Create a pending subscription record
    // This will be updated via webhook when subscription is created
    // For now, we'll create it after checkout succeeds
    // createSubscription({
    //   customerId,
    //   stripeSubscriptionId: 'pending', // Will be updated via webhook
    //   planType,
    //   serviceLocation,
    //   defaultServiceType,
    //   defaultAddOns,
    //   status: 'trialing',
    //   nextBillingDate: null,
    // });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

