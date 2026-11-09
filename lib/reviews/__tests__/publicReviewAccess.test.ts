import { describe, expect, it } from 'vitest';
import { publicGoogleReviewHref } from '@/lib/reviews/publicReviewAccess';

const URL = 'https://example.com/google-review';

describe('public Google review access', () => {
  it.each([1, 2, 3, 4, 5])('uses the same public link for rating %s', (rating) => {
    expect(publicGoogleReviewHref(rating, URL)).toBe(URL);
  });

  it('gives every rating the same destination', () => {
    const links = [1, 2, 3, 4, 5].map((rating) => publicGoogleReviewHref(rating, URL));
    expect(new Set(links)).toEqual(new Set([URL]));
  });

  it('still offers the link before a rating is selected', () => {
    expect(publicGoogleReviewHref(0, URL)).toBe(URL);
  });

  it('hides the link only when no destination is configured', () => {
    expect(publicGoogleReviewHref(5, null)).toBeNull();
    expect(publicGoogleReviewHref(1, '  ')).toBeNull();
  });
});
