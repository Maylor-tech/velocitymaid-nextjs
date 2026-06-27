/**
 * Customer portal access rules — block internal team from guest portal.
 */

const BLOCKED_CUSTOMER_EMAILS = new Set([
  'caryll@velocitymaid.com',
  'caryll.dagupen@velocitymaid.com',
  'caryll2600@gmail.com',
]);

export function isCustomerPortalEmailBlocked(email: string | null | undefined): boolean {
  if (!email) return false;
  return BLOCKED_CUSTOMER_EMAILS.has(email.trim().toLowerCase());
}

export function customerPortalBlockedMessage(): string {
  return 'This email is registered for team access. Please sign in at the cleaner portal instead.';
}
