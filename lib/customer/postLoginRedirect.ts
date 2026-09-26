/**
 * Safe post-login destinations for the customer portal.
 *
 * Never treat an arbitrary /customer/* prefix as safe — nonexistent paths
 * soft-404 after OTP (Incident #001). Allow only known static routes and
 * concrete dynamic job/property/booking detail patterns.
 */

export const CUSTOMER_PORTAL_HOME = '/customer/jobs';

/** Legacy aliases that must land on the canonical jobs home. */
const LEGACY_HOME_PATHS = new Set([
  '/customer',
  '/customer/home',
  '/customer/dashboard',
]);

/** Exact static pages that exist under app/customer (auth pages excluded). */
const STATIC_SAFE_PATHS = new Set([
  '/customer/jobs',
  '/customer/profile',
  '/customer/properties',
  '/customer/payments',
  '/customer/payment-history',
  '/customer/receipts',
  '/customer/invoices',
  '/customer/billing',
  '/customer/preferences',
  '/customer/referrals',
  '/customer/reports',
  '/customer/services',
  '/customer/tips',
  '/customer/upcoming',
  '/customer/history',
]);

/** Path segments for Job / Property / booking detail IDs (UUID, cuid, nanoid). */
const SAFE_ID = '[a-zA-Z0-9_-]{8,64}';

const DYNAMIC_SAFE_PATTERNS: RegExp[] = [
  new RegExp(`^/customer/jobs/${SAFE_ID}$`),
  new RegExp(`^/customer/properties/${SAFE_ID}$`),
  new RegExp(`^/customer/properties/${SAFE_ID}/add-cleaning$`),
  new RegExp(`^/customer/booking/${SAFE_ID}$`),
];

/** Query keys allowed on specific static destinations. */
const ALLOWED_QUERY_BY_PATH: Record<string, Set<string>> = {
  '/customer/jobs': new Set(['created', 'status', 'needTipJob', 'balance']),
  '/customer/payments': new Set(['tab']),
  '/customer/payment-history': new Set(['tab']),
  '/customer/receipts': new Set(['tab']),
  '/customer/invoices': new Set(['tab']),
};

function looksLikeAbsoluteOrSchemed(value: string): boolean {
  if (value.startsWith('//')) return true;
  // http:, https:, javascript:, data:, etc.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return true;
  return false;
}

/**
 * Decode repeatedly so %252F-style chains cannot slip past checks, then fail closed.
 */
function decodeRedirectCandidate(raw: string): string | null {
  let current = raw;
  for (let i = 0; i < 4; i++) {
    try {
      const next = decodeURIComponent(current.replace(/\+/g, ' '));
      if (next === current) break;
      current = next;
    } catch {
      return null;
    }
  }
  return current;
}

function sanitizeQueryForPath(pathname: string, search: string): string {
  if (!search || search === '?') return '';
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const allowed = ALLOWED_QUERY_BY_PATH[pathname];
  if (!allowed || allowed.size === 0) return '';

  const params = new URLSearchParams(raw);
  const kept = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (!allowed.has(key)) continue;
    if (looksLikeAbsoluteOrSchemed(value) || value.includes('//')) continue;
    if (value.length > 128) continue;
    kept.append(key, value);
  }
  const qs = kept.toString();
  return qs ? `?${qs}` : '';
}

function splitPathAndSearch(value: string): { pathname: string; search: string } {
  const hashIdx = value.indexOf('#');
  const withoutHash = hashIdx >= 0 ? value.slice(0, hashIdx) : value;
  const qIdx = withoutHash.indexOf('?');
  if (qIdx < 0) {
    return { pathname: withoutHash, search: '' };
  }
  return {
    pathname: withoutHash.slice(0, qIdx),
    search: withoutHash.slice(qIdx),
  };
}

function normalizePathname(pathname: string): string {
  let path = pathname.trim();
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  // Portal routes are lowercase; case variants must not soft-404 after login.
  return path.toLowerCase();
}

function isDynamicSafePath(pathname: string): boolean {
  return DYNAMIC_SAFE_PATTERNS.some((re) => re.test(pathname));
}

/**
 * Resolve a user-/middleware-supplied redirect into a safe internal customer
 * portal path. Always returns a same-origin relative path under the portal.
 * Never returns an open redirect.
 */
export function resolveCustomerPostLoginRedirect(
  raw: string | null | undefined
): string {
  if (raw == null) return CUSTOMER_PORTAL_HOME;

  const trimmed = String(raw).trim();
  if (!trimmed) return CUSTOMER_PORTAL_HOME;

  // Must be a relative path before any decoding games.
  if (!trimmed.startsWith('/') || looksLikeAbsoluteOrSchemed(trimmed)) {
    return CUSTOMER_PORTAL_HOME;
  }

  const decoded = decodeRedirectCandidate(trimmed);
  if (decoded == null) return CUSTOMER_PORTAL_HOME;

  if (!decoded.startsWith('/') || looksLikeAbsoluteOrSchemed(decoded)) {
    return CUSTOMER_PORTAL_HOME;
  }

  if (decoded.includes('\\') || /[\0\r\n]/.test(decoded)) {
    return CUSTOMER_PORTAL_HOME;
  }

  const { pathname: rawPath, search } = splitPathAndSearch(decoded);
  const pathname = normalizePathname(rawPath);

  if (!pathname.startsWith('/customer')) {
    return CUSTOMER_PORTAL_HOME;
  }

  // Reject path traversal / dot segments after decode
  const segments = pathname.split('/').filter(Boolean);
  if (segments.some((s) => s === '.' || s === '..')) {
    return CUSTOMER_PORTAL_HOME;
  }

  // Auth pages are not post-login destinations
  if (pathname === '/customer/login' || pathname === '/customer/verify') {
    return CUSTOMER_PORTAL_HOME;
  }

  // Tip under /customer is redirected to public /tip — not a portal home
  if (pathname === '/customer/tip' || pathname.startsWith('/customer/tip/')) {
    return CUSTOMER_PORTAL_HOME;
  }

  // Explicitly reject non-portal prefixes (defense in depth after decode)
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/cleaner') ||
    pathname.startsWith('/cleaners') ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/saas') ||
    pathname.startsWith('/api')
  ) {
    return CUSTOMER_PORTAL_HOME;
  }

  if (LEGACY_HOME_PATHS.has(pathname)) {
    return CUSTOMER_PORTAL_HOME;
  }

  // Production hard-404s subscriptions; do not send users there after login
  if (pathname === '/customer/subscriptions') {
    return CUSTOMER_PORTAL_HOME;
  }

  if (STATIC_SAFE_PATHS.has(pathname)) {
    return `${pathname}${sanitizeQueryForPath(pathname, search)}`;
  }

  if (isDynamicSafePath(pathname)) {
    if (pathname.startsWith('/customer/jobs/')) {
      return `${pathname}${sanitizeQueryForPath('/customer/jobs', search)}`;
    }
    return pathname;
  }

  // Arbitrary / nonexistent /customer/* → canonical home
  return CUSTOMER_PORTAL_HOME;
}
