/**
 * Phase 3C: Stripe Connect Express Service
 * 
 * Handles Stripe Connect Express account creation and onboarding
 */

import Stripe from "stripe";

/**
 * Get Stripe client (lazy initialization)
 */
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }
  return new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });
}

/**
 * Create a Stripe Connect Express account for a cleaner
 * 
 * @param email - Cleaner's email
 * @param name - Cleaner's name
 * @returns Stripe account ID
 */
export async function createStripeConnectAccount(
  email: string,
  name?: string
): Promise<string> {
  const stripe = getStripe();

  const account = await stripe.accounts.create({
    type: "express",
    country: "US", // TODO: Make configurable
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      cleanerEmail: email,
    },
  });

  return account.id;
}

/**
 * Create an Account Link for onboarding
 * 
 * @param accountId - Stripe Connect account ID
 * @param returnUrl - URL to return to after onboarding
 * @param refreshUrl - URL to refresh the link if expired
 * @returns Account Link URL
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const stripe = getStripe();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });

  return accountLink.url;
}

/**
 * Get Stripe account status
 * 
 * @param accountId - Stripe Connect account ID
 * @returns Account status information
 */
export async function getStripeAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingStatus: string | null;
  requirementsDueCount: number;
  currentlyDue: string[];
  eventuallyDue: string[];
}> {
  const stripe = getStripe();

  const account = await stripe.accounts.retrieve(accountId);

  // Determine onboarding status
  let onboardingStatus: string | null = null;
  if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
    onboardingStatus = "complete";
  } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
    onboardingStatus = "pending";
  } else if (account.requirements?.disabled_reason) {
    onboardingStatus = "restricted";
  } else {
    onboardingStatus = "pending";
  }

  const requirementsDueCount = (account.requirements?.currently_due || []).length;

  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    onboardingStatus,
    requirementsDueCount,
    currentlyDue: account.requirements?.currently_due || [],
    eventuallyDue: account.requirements?.eventually_due || [],
  };
}

