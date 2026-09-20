/**
 * Phase 1D-B — guest-facing property stay card copy (content only; no artwork).
 * Public Google reviews must stay off this card.
 */

export const STAY_CARD_VERSION = 'VM-STAY-CARD-v1';

export const STAY_CARD_COPY = {
  brand: 'VELOCITYMAID',
  headline: 'How was your stay?',
  context: 'We prepared this home for your arrival.',
  cta:
    'Scan to privately share feedback about the cleaning or, if you wish, leave a tip for the cleaning team.',
  noLogin: 'No login required.',
  checkoutHint: 'You’ll only need your checkout date.',
  tippingOptional: 'Tipping is optional.',
  googleReviewsNote:
    'Keep public Google reviews completely separate from this card.',
} as const;
