import { afterEach, describe, expect, it } from 'vitest';
import {
  GoogleReviewUrlError,
  getGoogleReviewUrlForMarket,
  requireGoogleReviewUrl,
  resolveReviewMarket,
} from '@/lib/reviews/googleReviewUrl';

const VT_URL = 'https://g.page/r/Ccs_uOvQIwh5ECE/review';
const NJ_URL = 'https://g.page/r/NJ_VERIFIED_EXAMPLE/review';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('resolveReviewMarket', () => {
  it('resolves Vermont from branch slug', () => {
    expect(resolveReviewMarket({ branchSlug: 'vermont' })).toBe('vermont');
    expect(resolveReviewMarket({ branchSlug: 'vermont-middlebury' })).toBe('vermont');
  });

  it('resolves New Jersey from branch slug or serviceLocation', () => {
    expect(resolveReviewMarket({ branchSlug: 'new-jersey' })).toBe('new-jersey');
    expect(resolveReviewMarket({ serviceLocation: 'new_jersey' })).toBe('new-jersey');
  });

  it('returns null when branch cannot be resolved (no silent Vermont fallback)', () => {
    expect(resolveReviewMarket({})).toBeNull();
    expect(resolveReviewMarket({ branchSlug: null, serviceLocation: null })).toBeNull();
    expect(resolveReviewMarket({ branchSlug: 'jamaica', serviceLocation: null })).toBeNull();
  });
});

describe('requireGoogleReviewUrl', () => {
  it('returns the Vermont g.page URL for Vermont jobs', () => {
    process.env.NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL = VT_URL;
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL = NJ_URL;

    const result = requireGoogleReviewUrl({
      branchSlug: 'vermont',
      jobId: 'job-vt-1',
    });
    expect(result.market).toBe('vermont');
    expect(result.url).toBe(VT_URL);
    expect(result.url).not.toContain('PLACEHOLDER');
    expect(result.url).not.toBe(NJ_URL);
  });

  it('returns the NJ URL for New Jersey jobs and never the Vermont URL', () => {
    process.env.NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL = VT_URL;
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL = NJ_URL;

    const result = requireGoogleReviewUrl({
      branchSlug: 'new-jersey',
      jobId: 'job-nj-1',
    });
    expect(result.market).toBe('new-jersey');
    expect(result.url).toBe(NJ_URL);
    expect(result.url).not.toBe(VT_URL);
  });

  it('fails safely when branch is unresolved', () => {
    process.env.NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL = VT_URL;
    expect(() =>
      requireGoogleReviewUrl({ branchSlug: null, serviceLocation: null, jobId: 'job-x' })
    ).toThrow(GoogleReviewUrlError);
    try {
      requireGoogleReviewUrl({ jobId: 'job-x' });
    } catch (err) {
      expect(err).toBeInstanceOf(GoogleReviewUrlError);
      expect((err as GoogleReviewUrlError).code).toBe('UNRESOLVED_BRANCH');
    }
  });

  it('fails when Vermont env is missing', () => {
    delete process.env.NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL;
    expect(() => getGoogleReviewUrlForMarket('vermont')).toThrow(/NEXT_PUBLIC_VT_GOOGLE_REVIEW_URL/);
  });

  it('rejects NJ placeholder URLs', () => {
    process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL = 'https://g.page/r/PLACEHOLDER/review';
    expect(() => getGoogleReviewUrlForMarket('new-jersey')).toThrow(GoogleReviewUrlError);
  });
});
