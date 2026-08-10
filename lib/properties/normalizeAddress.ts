/**
 * Normalize a service address for Property matching.
 * Conservative: strips punctuation/extra whitespace and lowercases.
 * Does NOT fuzzy-match across different streets or units.
 */
export function normalizeAddressKey(address: string | null | undefined): string {
  if (!address) return '';
  return address
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\broad\b/g, 'rd')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when two address strings resolve to the same normalized key. */
export function addressesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizeAddressKey(a);
  const right = normalizeAddressKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}
