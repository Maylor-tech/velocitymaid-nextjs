/**
 * Branch-scoped admin access.
 * Owner authority is the ADMIN_EMAIL account only. Membership count does not grant it.
 * A non-owner with several branches stays unscoped in the page shell until an explicit
 * branch selection is added. See docs/admin-auth-rollout.md.
 */

export type AdminSessionPayload = {
  userId: string;
  role: string;
  branchId?: string;
  /** True when admin is limited to one assigned branch. */
  isBranchScoped?: boolean;
  /** True only for the explicit owner account. */
  isOwner?: boolean;
};

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!ownerEmail && !!email && email.trim().toLowerCase() === ownerEmail;
}

/** Explicit owner authorization. A larger branch count is not owner access. */
export function isOwnerAdmin(email: string | null | undefined): boolean {
  return isSuperAdminEmail(email);
}

/** Single-branch non-owners are limited to that branch. */
export function isBranchScopedAdmin(
  email: string | null | undefined,
  branchCount: number
): boolean {
  if (isOwnerAdmin(email)) return false;
  return branchCount === 1;
}

export function isGlobalBillingPath(pathname: string): boolean {
  return pathname === '/api/admin/invoices' || pathname.startsWith('/api/admin/invoices/');
}

const BRANCH_SCOPED_PAGE_PREFIXES = [
  '/admin/jobs',
  '/admin/feedback',
  '/admin/profitability',
];

export function isPathAllowedForBranchScopedAdmin(pathname: string): boolean {
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return true;
  }
  // Exact /admin = Daily Operations Command Center (branch-filtered)
  if (pathname === '/admin') return true;
  return BRANCH_SCOPED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** API routes a branch-scoped admin may call (jobs ops + command center — no billing/payouts). */
export function isPathAllowedForBranchScopedAdminApi(pathname: string): boolean {
  if (pathname === '/api/admin/me') return true;
  if (pathname.startsWith('/api/admin/cleaners/by-branch')) return true;
  if (
    pathname === '/api/admin/dashboard/command-center' ||
    pathname.startsWith('/api/admin/dashboard/command-center/')
  ) {
    return true;
  }
  if (
    pathname === '/api/admin/feedback' ||
    pathname.startsWith('/api/admin/feedback/')
  ) {
    return true;
  }
  if (
    pathname === '/api/admin/finance/owner-profitability' ||
    pathname.startsWith('/api/admin/finance/owner-profitability/')
  ) {
    return true;
  }
  if (!pathname.startsWith('/api/admin/jobs')) return false;

  const blockedSegments = ['/payout/', '/mark-paid', '/pricing', '/billing'];
  return !blockedSegments.some((seg) => pathname.includes(seg));
}

/** Env-based password for branch-scoped admin login (per email). */
export function getScopedAdminPassword(email: string): string | undefined {
  const normalized = email.trim().toLowerCase();

  if (normalized === 'caryll@velocitymaid.com') {
    return process.env.CARYLL_ADMIN_PASSWORD?.trim();
  }

  const envKey = `ADMIN_PASSWORD_${normalized.replace(/[@.]/g, '_').toUpperCase()}`;
  return process.env[envKey]?.trim();
}
