/**
 * Vermont cleaner-offer dispatcher. Default OFF until production acceptance.
 * Other markets keep immediate assign while this flag is off or the branch
 * is not in the allowlist.
 */

const DEFAULT_BRANCH_SLUGS = ['vermont'] as const;

export function isDispatchOffersFlagOn(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.DISPATCH_OFFERS_VERMONT === 'true';
}

export function dispatchOfferBranchSlugs(
  env: Record<string, string | undefined> = process.env
): string[] {
  const extra = (env.DISPATCH_OFFERS_BRANCH_SLUGS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_BRANCH_SLUGS, ...extra])];
}

export function isDispatchOffersEnabledForBranch(
  slug: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): boolean {
  if (!isDispatchOffersFlagOn(env)) return false;
  if (!slug) return false;
  return dispatchOfferBranchSlugs(env).includes(slug.trim().toLowerCase());
}
