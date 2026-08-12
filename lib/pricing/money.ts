/**
 * Integer-cent money helpers for pricing.
 * Persist and compare money via cents to avoid float drift.
 */

export function dollarsToCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/** Round a dollar amount to 2 decimal places via cents. */
export function roundMoney(amount: number): number {
  return centsToDollars(dollarsToCents(amount));
}
