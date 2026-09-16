/**
 * Branch-aware Google Business Profile review URLs.
 *
 * Google public reviews are separate from internal /review/[jobId] feedback.
 * Never silently route an unresolved branch to Vermont (or NJ).
 */

export type ReviewMarket = 'vermont' | 'new-jersey';

export type GoogleReviewUrlErrorCode =
  | 'UNRESOLVED_BRANCH'
  | 'MISSING_ENV'
  | 'PLACEHOLDER_URL';

export class GoogleReviewUrlError extends Error {
  readonly code: GoogleReviewUrlErrorCode;

  constructor(code: GoogleReviewUrlErrorCode, message: string) {
    super(message);
    this.name = 'GoogleReviewUrlError';
    this.code = code;
  }
}

/** Legacy Vermont Place ID fallback only for explicit Vermont market when env is unset — NOT used for unknown branches. */
export const GOOGLE_PLACE_ID_VERMONT = 'ChIJed_o8m9obIMRyz-469AjCHk';

export const DEFAULT_VERMONT_PLACE_ID_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID_VERMONT}`;

/** @deprecated Prefer branch-aware helpers. Kept for TipSuccess / older imports. */
export const GOOGLE_PLACE_ID = GOOGLE_PLACE_ID_VERMONT;

/** @deprecated Prefer getGoogleReviewUrlForMarket / requireGoogleReviewUrl. */
export const DEFAULT_GOOGLE_REVIEW_URL = DEFAULT_VERMONT_PLACE_ID_REVIEW_URL;

const PLACEHOLDER_TOKEN = 'PLACEHOLDER';

function normalizeLocation(value: string | null | undefined): string {
  return (value || '').toLowerCase().replace(/[\s-]+/g, '_').trim();
}

/**
 * Resolve review market from branch slug and/or job serviceLocation.
 * Returns null when the market cannot be determined reliably.
 */
export function resolveReviewMarket(input: {
  branchSlug?: string | null;
  serviceLocation?: string | null;
}): ReviewMarket | null {
  const slug = (input.branchSlug || '').toLowerCase().trim();
  const loc = normalizeLocation(input.serviceLocation);

  const fromSlugVermont =
    slug === 'vermont' ||
    slug === 'vt' ||
    slug.startsWith('vermont-') ||
    slug.includes('vermont');
  const fromSlugNj =
    slug === 'new-jersey' ||
    slug === 'nj' ||
    slug.startsWith('new-jersey') ||
    slug.includes('new-jersey') ||
    slug.includes('new_jersey');

  if (fromSlugVermont && !fromSlugNj) return 'vermont';
  if (fromSlugNj && !fromSlugVermont) return 'new-jersey';

  if (loc === 'vermont') return 'vermont';
  if (loc === 'new_jersey' || loc === 'newjersey') return 'new-jersey';

  // Ambiguous or empty — do not guess.
  if (fromSlugVermont && fromSlugNj) return null;
  return null;
}

function assertNotPlaceholder(url: string, envName: string): string {
  if (url.toUpperCase().includes(PLACEHOLDER_TOKEN)) {
    throw new GoogleReviewUrlError(
      'PLACEHOLDER_URL',
      `${envName} still contains a PLACEHOLDER value. Set the verified Google review URL.`
    );
  }
  return url;
}

/**
 * Resolve the Google review destination for a known market.
 * Throws when the market's env is missing or still a placeholder (NJ).
 * Vermont may fall back to the known Place ID URL only when market === vermont
 * and NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL is unset (ops should still set the env).
 */
export function getGoogleReviewUrlForMarket(market: ReviewMarket): string {
  if (market === 'vermont') {
    const fromEnv = process.env.NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL?.trim();
    if (!fromEnv) {
      throw new GoogleReviewUrlError(
        'MISSING_ENV',
        'NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL is not configured. Add the verified Vermont Google review URL in Vercel/env before sending Google review requests.'
      );
    }
    return assertNotPlaceholder(fromEnv, 'NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL');
  }

  const fromEnv =
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL?.trim() ||
    process.env.GOOGLE_REVIEW_URL?.trim();
  if (!fromEnv) {
    throw new GoogleReviewUrlError(
      'MISSING_ENV',
      'NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL (or GOOGLE_REVIEW_URL) is not configured for New Jersey Google reviews.'
    );
  }
  return assertNotPlaceholder(fromEnv, 'NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL');
}

/**
 * Require a Google review URL for a job. Fails safely if branch/market is unknown.
 */
export function requireGoogleReviewUrl(input: {
  branchSlug?: string | null;
  serviceLocation?: string | null;
  jobId?: string | null;
}): { market: ReviewMarket; url: string } {
  const market = resolveReviewMarket(input);
  if (!market) {
    const jobHint = input.jobId ? ` (job ${input.jobId})` : '';
    throw new GoogleReviewUrlError(
      'UNRESOLVED_BRANCH',
      `Cannot send a Google review request${jobHint}: job branch/service location is unresolved. Refusing to guess Vermont vs New Jersey.`
    );
  }
  return { market, url: getGoogleReviewUrlForMarket(market) };
}

/**
 * @deprecated Prefer requireGoogleReviewUrl with an explicit branch.
 * Legacy helper used by NJ marketing pages / older callers — NJ env chain only.
 */
export function getGoogleReviewUrl(): string {
  return (
    process.env.GOOGLE_REVIEW_URL?.trim() ||
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL?.trim() ||
    DEFAULT_VERMONT_PLACE_ID_REVIEW_URL
  );
}

/** Client-safe NJ public page helper (build-time NEXT_PUBLIC). */
export function getPublicGoogleReviewUrl(): string {
  return (
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL?.trim() ||
    DEFAULT_VERMONT_PLACE_ID_REVIEW_URL
  );
}

/** Client-safe Vermont public helper. */
export function getPublicVermontGoogleReviewUrl(): string {
  return (
    process.env.NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL?.trim() ||
    DEFAULT_VERMONT_PLACE_ID_REVIEW_URL
  );
}
