/**
 * Public Google review access does not depend on the star rating.
 * Ratings 1 through 5, and a form that has not been rated yet, all use the same URL.
 */
export function publicGoogleReviewHref(
  rating: number,
  googleReviewUrl: string | null | undefined
): string | null {
  const url = googleReviewUrl?.trim() || '';
  if (!url) return null;
  if (typeof rating !== 'number' || Number.isNaN(rating)) return url;
  return url;
}
