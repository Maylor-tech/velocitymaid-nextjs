/**
 * High-level payment preference on CleanerProfile (not a money rail).
 * Operational destination details stay on CleanerPaymentMethod when present.
 * Never store raw bank account / routing numbers here.
 */

export const PAYMENT_PREFERENCES = [
  'ZELLE',
  'CHECK',
  'ACH_PROVIDER',
  'STRIPE_CONNECT',
  'OTHER',
] as const;

export type PaymentPreference = (typeof PAYMENT_PREFERENCES)[number];

export function isPaymentPreference(value: unknown): value is PaymentPreference {
  return (
    typeof value === 'string' &&
    (PAYMENT_PREFERENCES as readonly string[]).includes(value)
  );
}

export function normalizePaymentPreference(
  value: string | null | undefined
): PaymentPreference | null {
  if (value == null || value === '') return null;
  if (isPaymentPreference(value)) return value;
  return null;
}
