export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getSubscriptionByCustomerId, updateSubscription, type SubscriptionStatus } from '@/utils/subscriptionData';
import { sendServicePauseNotice } from '@/lib/notifications/servicePauseNotice';
import { getStripe } from '@/utils/stripe';

/**
 * Update Subscription API
 * 
 * PATCH /api/customer/subscriptions/update
 * 
 * Body: {
 *   action: "cancel" | "pause" | "resume",
 *   subscriptionId?: string  // Optional, uses customer's active subscription if not provided
 * }
 */
export async function PATCH(request: NextRequest) {
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
    const { action, subscriptionId } = body;

    // Validate action
    const validActions = ['cancel', 'pause', 'resume'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: cancel, pause, or resume' },
        { status: 400 }
      );
    }

    // Get subscription
    const subscription = subscriptionId 
      ? getSubscriptionByCustomerId(subscriptionId)
      : getSubscriptionByCustomerId(customerId);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Skip pause if already paused (no duplicate notice)
    if (action === 'pause' && subscription.status === 'paused') {
      return NextResponse.json({
        success: true,
        subscription,
        message: 'Subscription is already paused',
      });
    }

    const stripe = getStripe();
    let updatedStripeSubscription;
    try {
      if (action === 'cancel') {
        // Cancel at period end (so customer gets full period)
        updatedStripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );
      } else if (action === 'pause') {
        // Pause subscription (if supported by Stripe)
        // Note: Stripe doesn't have a built-in pause, so we'll use cancel_at_period_end
        updatedStripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            pause_collection: {
              behavior: 'mark_uncollectible',
            },
          }
        );
      } else if (action === 'resume') {
        // Resume subscription
        updatedStripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: false,
            pause_collection: null,
          }
        );
      }
    } catch (error: unknown) {
      console.error('Error updating Stripe subscription:', error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to update subscription in Stripe' },
        { status: 500 }
      );
    }

    // Update local subscription
    const newStatus: SubscriptionStatus = action === 'cancel' ? 'canceled' :
                     action === 'pause' ? 'paused' :
                     'active';

    const updated = updateSubscription(subscription.id, {
      status: newStatus,
      nextBillingDate: updatedStripeSubscription && 'current_period_end' in updatedStripeSubscription && typeof updatedStripeSubscription.current_period_end === 'number'
        ? new Date(updatedStripeSubscription.current_period_end * 1000).toISOString()
        : subscription.nextBillingDate,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    // Send pause notice once per pause action (audit cooldown prevents duplicate)
    if (action === 'pause') {
      sendServicePauseNotice({
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      subscription: updated,
      message: `Subscription ${action}ed successfully`,
    });
  } catch (error: unknown) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

