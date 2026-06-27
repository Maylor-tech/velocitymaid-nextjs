const VT_AREAS = new Set([
  'Ludlow',
  'Okemo',
  'Killington',
  'Woodstock',
  'Rutland',
  'Springfield',
  'Other',
]);

interface BranchOption {
  id: string;
  slug: string;
  country?: string | null;
}

/** Map service-area selections to a branch id (VT vs NJ). */
export function resolveBranchIdFromServiceAreas(
  areas: string[],
  branches: BranchOption[]
): string | null {
  const hasNJ = areas.includes('New Jersey');
  const hasVT = areas.some((a) => VT_AREAS.has(a) && a !== 'Other');

  const nj = branches.find((b) => b.slug === 'new-jersey');
  const vt = branches.find((b) => b.slug === 'vermont');

  if (hasNJ && !hasVT) return nj?.id ?? null;
  if (hasVT && !hasNJ) return vt?.id ?? null;
  if (hasNJ && hasVT) return vt?.id ?? nj?.id ?? null;

  const usa = branches.filter(
    (b) =>
      b.country === 'USA' ||
      b.country === 'US' ||
      b.country === 'United States' ||
      b.slug === 'vermont' ||
      b.slug === 'new-jersey'
  );
  return usa[0]?.id ?? branches[0]?.id ?? null;
}
