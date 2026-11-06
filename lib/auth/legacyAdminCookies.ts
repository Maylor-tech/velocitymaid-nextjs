export const LEGACY_ADMIN_COOKIE_NAMES = ['adminId', 'adminSession'] as const;

/** Parent-domain copies are a different cookie from a host-only clear. */
export const LEGACY_ADMIN_COOKIE_DOMAIN = 'velocitymaid.com';

function clearCookie(name: string, domain?: string): string {
  const attributes = ['Path=/', 'Max-Age=0', 'HttpOnly', 'SameSite=Strict'];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  if (domain) attributes.push(`Domain=${domain}`);
  return `${name}=; ${attributes.join('; ')}`;
}

/**
 * Expire unsigned admin cookies for Path=/.
 * The host-only header does not match Domain=velocitymaid.com, so both are required.
 * Append these after any cookie-jar write. That jar keeps one value per name.
 */
export function legacyAdminClearSetCookies(): string[] {
  const headers: string[] = [];
  for (const name of LEGACY_ADMIN_COOKIE_NAMES) {
    headers.push(clearCookie(name));
    headers.push(clearCookie(name, LEGACY_ADMIN_COOKIE_DOMAIN));
  }
  return headers;
}

export function appendLegacyAdminCookieClears(headers: Headers): void {
  for (const cookie of legacyAdminClearSetCookies()) {
    headers.append('set-cookie', cookie);
  }
}
