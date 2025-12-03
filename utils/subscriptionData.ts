/**
 * Customer Subscription Data Model
 * 
 * TODO: Replace with database queries when connecting to real DB
 */

export type PlanType = 'weekly' | 'biweekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'canceled' | 'past_due' | 'trialing';

export interface CustomerSubscription {
  id: string;
  customerId: string;
  stripeSubscriptionId: string;
  planType: PlanType;
  serviceLocation: 'new_jersey' | 'vermont';
  defaultServiceType: 'basic' | 'deep' | 'moveInOut';
  defaultAddOns: string[];
  status: SubscriptionStatus;
  nextBillingDate: string | null; // ISO date string
  createdAt: string;
  updatedAt: string;
}

/**
 * Mock subscriptions storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_SUBSCRIPTIONS: CustomerSubscription[] = [];

/**
 * Get subscription by customer ID
 * TODO: Replace with database SELECT WHERE customerId = ?
 */
export function getSubscriptionByCustomerId(customerId: string): CustomerSubscription | null {
  return MOCK_SUBSCRIPTIONS.find(s => s.customerId === customerId) || null;
}

/**
 * Get subscription by Stripe subscription ID
 * TODO: Replace with database SELECT WHERE stripeSubscriptionId = ?
 */
export function getSubscriptionByStripeId(stripeSubscriptionId: string): CustomerSubscription | null {
  return MOCK_SUBSCRIPTIONS.find(s => s.stripeSubscriptionId === stripeSubscriptionId) || null;
}

/**
 * Create subscription
 * TODO: Replace with database INSERT
 */
export function createSubscription(
  subscription: Omit<CustomerSubscription, 'id' | 'createdAt' | 'updatedAt'>
): CustomerSubscription {
  const newSubscription: CustomerSubscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...subscription,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_SUBSCRIPTIONS.push(newSubscription);
  return newSubscription;
}

/**
 * Update subscription
 * TODO: Replace with database UPDATE
 */
export function updateSubscription(
  id: string,
  updates: Partial<Omit<CustomerSubscription, 'id' | 'createdAt'>>
): CustomerSubscription | null {
  const subscription = MOCK_SUBSCRIPTIONS.find(s => s.id === id);
  if (!subscription) {
    return null;
  }
  
  const updated: CustomerSubscription = {
    ...subscription,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  const index = MOCK_SUBSCRIPTIONS.findIndex(s => s.id === id);
  if (index !== -1) {
    MOCK_SUBSCRIPTIONS[index] = updated;
  }
  
  return updated;
}

/**
 * Update subscription by Stripe ID
 * TODO: Replace with database UPDATE WHERE stripeSubscriptionId = ?
 */
export function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  updates: Partial<Omit<CustomerSubscription, 'id' | 'createdAt'>>
): CustomerSubscription | null {
  const subscription = getSubscriptionByStripeId(stripeSubscriptionId);
  if (!subscription) {
    return null;
  }
  
  return updateSubscription(subscription.id, updates);
}

/**
 * Database Schema (for future migration)
 * 
 * CREATE TABLE customer_subscriptions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   customer_id UUID NOT NULL,
 *   stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
 *   plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('weekly', 'biweekly', 'monthly')),
 *   service_location VARCHAR(20) NOT NULL CHECK (service_location IN ('new_jersey', 'vermont')),
 *   default_service_type VARCHAR(20) NOT NULL CHECK (default_service_type IN ('basic', 'deep', 'moveInOut')),
 *   default_add_ons TEXT[], -- Array of add-on names
 *   status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'canceled', 'past_due', 'trialing')),
 *   next_billing_date DATE,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
 * );
 * 
 * CREATE INDEX idx_subscriptions_customer ON customer_subscriptions(customer_id);
 * CREATE INDEX idx_subscriptions_stripe ON customer_subscriptions(stripe_subscription_id);
 */



