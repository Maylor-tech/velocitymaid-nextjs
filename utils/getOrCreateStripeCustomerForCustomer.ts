/**
 * Get or Create Stripe Customer for Customer
 * 
 * Ensures a customer has a Stripe customer ID
 */

import { getStripe } from './stripe';
import { findCustomerById, updateCustomerStripeId, type Customer } from './customerData';

/**
 * Get or create a Stripe customer for the given customer
 * 
 * @param customer - The customer object
 * @returns The Stripe customer ID
 */
export async function getOrCreateStripeCustomerForCustomer(
  customer: Customer
): Promise<string> {
  // If customer already has a Stripe customer ID, return it
  const stripe = getStripe();

  if (customer.stripeCustomerId) {
    try {
      // Verify the Stripe customer still exists
      await stripe.customers.retrieve(customer.stripeCustomerId);
      return customer.stripeCustomerId;
    } catch {
      // If customer doesn't exist in Stripe, create a new one
      console.warn(`Stripe customer ${customer.stripeCustomerId} not found, creating new one`);
    }
  }

  // Create a new Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email: customer.email,
    name: `${customer.firstName} ${customer.lastName}`,
    phone: customer.phone || undefined,
    metadata: {
      customerId: customer.id,
      region: customer.region || '',
    },
  });

  // Update customer record with Stripe customer ID
  updateCustomerStripeId(customer.id, stripeCustomer.id);

  return stripeCustomer.id;
}

/**
 * Get Stripe customer by customer ID
 * 
 * @param customerId - The internal customer ID
 * @returns The Stripe customer ID or null
 */
export async function getStripeCustomerId(customerId: string): Promise<string | null> {
  const customer = findCustomerById(customerId);
  if (!customer) {
    return null;
  }

  return getOrCreateStripeCustomerForCustomer(customer);
}




