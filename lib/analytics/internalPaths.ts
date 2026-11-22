/**
 * Pages used by the VelocityMaid team, cleaners and existing customers.
 * Google Analytics is switched off on these so marketing numbers only
 * count visitors to the public site.
 *
 * Kept public on purpose: /cleaners/apply (recruitment), /tip, /review.
 */
export const INTERNAL_PATH_PATTERN =
  '^/(admin|dashboard|cleaner|customer|invoice|report|dev|saas|branch-owner|pilot)(/|$)|^/cleaners/login(/|$)';

const internalPathRegex = new RegExp(INTERNAL_PATH_PATTERN);

export function isInternalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return internalPathRegex.test(pathname);
}
