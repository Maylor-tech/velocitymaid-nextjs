/** VelocityMaid Google Business Profile Place ID (Ludlow, VT). */
export const GOOGLE_PLACE_ID = "ChIJed_o8m9obIMRyz-469AjCHk";

export const DEFAULT_GOOGLE_REVIEW_URL =
  `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;

/** Env override for server routes and cron jobs. */
export function getGoogleReviewUrl(): string {
  return (
    process.env.GOOGLE_REVIEW_URL ||
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL ||
    DEFAULT_GOOGLE_REVIEW_URL
  );
}

/** Env override for client components (NEXT_PUBLIC only at build time). */
export function getPublicGoogleReviewUrl(): string {
  return (
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL ||
    DEFAULT_GOOGLE_REVIEW_URL
  );
}
