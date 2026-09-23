/**
 * Phase 1D-B — guest-facing property stay card copy (content only; no artwork).
 * Public Google reviews must stay off this card.
 */

export const STAY_CARD_VERSION = 'VM-STAY-CARD-v1.1';

export const STAY_CARD_COPY = {
  brand: 'VELOCITYMAID',
  headline: 'How was your stay?',
  context: 'We prepared this home for your arrival.',
  cta:
    'Scan to privately share feedback about the cleaning or, if you wish, leave a tip for the cleaning team.',
  noLogin: 'No login required.',
  /** Printed under SCAN HERE — v1.1 identifies stay without requiring remembered checkout date alone. */
  checkoutHint: 'No login required. We’ll help you identify your stay.',
  tippingOptional: 'Tipping is optional.',
  googleReviewsNote:
    'Keep public Google reviews completely separate from this card.',
} as const;
