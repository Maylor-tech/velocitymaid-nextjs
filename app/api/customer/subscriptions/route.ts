export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getSubscriptionByCustomerId } from '@/utils/subscriptionData';
import stripe from '@/utils/stripe';
import Stripe from 'stripe';

/**
 * Get Customer Subscriptions API
 * 
 * GET /api/customer/subscriptions
 * 
 * Returns current subscription for the customer
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

    // Get local subscription record
    const subscription = getSubscriptionByCustomerId(customerId);

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }

    // Sync status from Stripe
    let stripeSubscription: Stripe.Subscription | null = null;
    try {
      const retrieved = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      stripeSubscription = retrieved;
      
      // Update local status if different
      if (stripeSubscription.status !== subscription.status) {
        // TODO: Update subscription status in database
        // updateSubscription(subscription.id, { status: stripeSubscription.status as SubscriptionStatus });
      }
    } catch (error) {
      console.error('Error fetching Stripe subscription:', error);
      // Continue with local subscription data
    }

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        stripeStatus: stripeSubscription?.status || subscription.status,
        currentPeriodEnd: stripeSubscription && 'current_period_end' in stripeSubscription && typeof stripeSubscription.current_period_end === 'number'
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : subscription.nextBillingDate,
      },
    });
  } catch (error: any) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

