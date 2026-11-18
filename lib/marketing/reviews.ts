/**
 * Public marketing reviews — real client quotes only.
 * Render the homepage reviews section only when this array has items.
 * Keep quotes word-for-word (including "Velocity Maid" and "every-time").
 * No aggregate rating badge / review JSON-LD until several reviews exist.
 *
 * Source: CURSOR_HANDOFF.md §5.7 (v1.1)
 */

export type MarketingReview = {
  quote: string;
  secondQuote?: string;
  name: string;
  context: string;
  /** Only set when the client supplied or approved a rating. */
  stars?: number;
  /** Full Google Maps (or Google) review URL when available. */
  sourceUrl: string;
  /**
   * Market-specific reviews (e.g. "vermont") render only on that market's page.
   * Reviews without a market are general and may appear on the homepage.
   */
  market?: string;
};

export const reviews: MarketingReview[] = [
  {
    quote:
      "We have since hired Velocity Maid for our turnover Airbnb cleanings and never looked back. Our house looks brand new every-time we have a cleaning and our guests are commenting the same.",
    secondQuote:
      "Brian and his team were incredibly thorough and spent more than the allotted time to be sure the house was left to our liking.",
    name: "Jeffrey L.",
    context: "Post-construction clean, then Airbnb turnovers · Okemo Valley, VT",
    stars: 5,
    // Approved mockup currently uses "#"; replace with the live Google Maps review URL when Brian confirms it.
    sourceUrl: "#",
  },
  {
    quote: "Thorough and a great job — the photos looked awesome!",
    name: "Tiffany P.",
    context: "Ludlow, VT",
    market: "vermont",
    // Permission granted for website use (see lib/marketing/testimonials.ts). No rating supplied.
    sourceUrl: "#",
  },
];

/** Reviews for a given market page, in file order. */
export function reviewsForMarket(market: string): MarketingReview[] {
  return reviews.filter((r) => !r.market || r.market === market);
}

/** Reviews with no market tag (homepage). */
export function generalReviews(): MarketingReview[] {
  return reviews.filter((r) => !r.market);
}
