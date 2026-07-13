/**
 * Branch-scoped admin access — Vermont-only operators vs super admin (Brian).
 */

export type AdminSessionPayload = {
  userId: string;
  role: string;
  branchId?: string;
  /** True when admin is limited to a single branch (not owner / super admin). */
  isBranchScoped?: boolean;
};

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!ownerEmail && !!email && email.trim().toLowerCase() === ownerEmail;
}

/** Single-branch admins (excluding owner email) are branch-scoped. */
export function isBranchScopedAdmin(
  email: string | null | undefined,
  branchCount: number
): boolean {
  if (isSuperAdminEmail(email)) return false;
  return branchCount === 1;
}

const BRANCH_SCOPED_PAGE_PREFIXES = ['/admin/jobs'];

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
