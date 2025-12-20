/**
 * Loyalty Points Engine
 * 
 * Handles loyalty point calculations and updates
 */

import { addLoyaltyPoints, findCustomerById } from './customerData';
import type { CustomerBooking } from './customerBookings';

/**
 * Points earned per service type
 */
const POINTS_PER_SERVICE: Record<string, number> = {
  basic: 10,
  deep: 15,
  moveInOut: 20,
};

/**
 * Points earned per $10 in tips
 */
const POINTS_PER_TIP_TIER = 5;
const TIP_TIER_AMOUNT = 10;

/**
 * Add loyalty points for a completed job
 * 
 * TODO: This should be called when:
 * - Job status is set to "completed"
 * - Via webhook when Stripe payment is confirmed
 * - Via admin action when marking job complete
 * 
 * @param customerId - The customer ID
 * @param job - The completed job
 */
export function addPointsForCompletedJob(
  customerId: string,
  job: CustomerBooking
): number {
  const customer = findCustomerById(customerId);
  if (!customer) {
    console.warn(`Customer ${customerId} not found for loyalty points`);
    return 0;
  }

  const serviceType = job.serviceType || 'basic';
  const points = POINTS_PER_SERVICE[serviceType] || POINTS_PER_SERVICE.basic;

  const updated = addLoyaltyPoints(customerId, points);
  if (updated) {
    console.log(`Added ${points} loyalty points to customer ${customerId} for ${serviceType} service`);
    return points;
  }

  return 0;
}

/**
 * Add loyalty points for a tip
 * 
 * TODO: This should be called when:
 * - Tip payment is confirmed via Stripe webhook
 * - Payment intent succeeds
 * 
 * @param customerId - The customer ID
 * @param tipAmount - The tip amount in dollars
 */
export function addPointsForTip(customerId: string, tipAmount: number): number {
  const customer = findCustomerById(customerId);
  if (!customer) {
    console.warn(`Customer ${customerId} not found for loyalty points`);
    return 0;
  }

  // Calculate points: 5 points per $10 tier
  const tiers = Math.floor(tipAmount / TIP_TIER_AMOUNT);
  const points = tiers * POINTS_PER_TIP_TIER;

  if (points > 0) {
    const updated = addLoyaltyPoints(customerId, points);
    if (updated) {
      console.log(`Added ${points} loyalty points to customer ${customerId} for $${tipAmount} tip`);
      return points;
    }
  }

  return 0;
}

/**
 * Get loyalty points for a customer
 * 
 * @param customerId - The customer ID
 * @returns The current loyalty points
 */
export function getLoyaltyPoints(customerId: string): number {
  const customer = findCustomerById(customerId);
  return customer?.loyaltyPoints || 0;
}

/**
 * Calculate points that would be earned for a service type
 * 
 * @param serviceType - The service type
 * @returns Points that would be earned
 */
export function getPointsForServiceType(serviceType: string): number {
  return POINTS_PER_SERVICE[serviceType] || POINTS_PER_SERVICE.basic;
}

/**
 * TODO: Webhook Integration Points
 * 
 * 1. Job Completion Webhook:
 *    - When job status changes to "completed"
 *    - Call: addPointsForCompletedJob(customerId, job)
 * 
 * 2. Tip Payment Webhook:
 *    - When Stripe payment intent succeeds for a tip
 *    - Call: addPointsForTip(customerId, tipAmount)
 * 
 * 3. Subscription Payment Webhook:
 *    - When subscription payment succeeds
 *    - Could add bonus points for subscription customers (future enhancement)
 */




