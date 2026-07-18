/** Approved public testimonials — quote and attribution only as cleared by the client. */

export type MarketingTestimonial = {
  name: string;
  location: string;
  /** Include only when the client supplied or approved a rating. */
  rating?: number;
  text: string;
};

/** Tiffany P. (Ludlow) — permission granted for website and Google profile use. */
export const TIFFANY_LUDLOW_TESTIMONIAL: MarketingTestimonial = {
  name: "Tiffany P.",
  location: "Ludlow, VT",
  text: "Thorough and a great job — the photos looked awesome!",
};

export const HOMEPAGE_TESTIMONIALS: MarketingTestimonial[] = [
  TIFFANY_LUDLOW_TESTIMONIAL,
];

export const VERMONT_TESTIMONIALS: MarketingTestimonial[] = [
  TIFFANY_LUDLOW_TESTIMONIAL,
];
