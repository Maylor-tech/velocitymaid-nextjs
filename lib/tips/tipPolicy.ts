/**
 * Guest tip financial policy invariants (P0-C).
 *
 * Locked rule: 100% of the guest's stated tip face value belongs to the
 * cleaner / service team. VelocityMaid takes $0 tip share. The ordinary
 * cleaning-service 65/35 split does NOT apply to guest tips. Stripe card
 * processing fees are a VelocityMaid platform expense (not deducted from
 * the tip ledger entitlement).
 *
 * Do not introduce application_fee_amount, Connect transfers that skim
 * tips, commissions, or any deduction from Tip.amount.
 */

/** Tip amount stored on Tip / charged on Stripe PI is the cleaner entitlement. */
export const TIP_FACE_VALUE_EQUALS_CLEANER_ENTITLEMENT = true as const;

/** Platform tip commission in cents — always zero by policy. */
export const TIP_PLATFORM_SHARE_CENTS = 0 as const;

/** Service payout split must never be applied to guest tips. */
export const TIP_USES_SERVICE_SPLIT = false as const;

/**
 * For accounting docs / tests: guest pays $N → cleaner entitlement = $N.
 */
export function cleanerTipEntitlementCents(guestTipAmountCents: number): number {
  if (!Number.isFinite(guestTipAmountCents) || guestTipAmountCents < 0) {
    throw new Error('Invalid tip amount');
  }
  return Math.round(guestTipAmountCents);
}
