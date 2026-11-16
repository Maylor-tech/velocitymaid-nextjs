/** Shared admin sign-out navigation. Cookie clear happens in GET /api/auth/admin-logout. */

export const ADMIN_LOGOUT_PATH = '/api/auth/admin-logout';

let signOutStarted = false;

/** Test-only: reset the process-local double-submit guard. */
export function resetAdminSignOutGuardForTests(): void {
  signOutStarted = false;
}

export function isAdminSignOutPending(): boolean {
  return signOutStarted;
}

/**
 * Synchronously claim the logout action and navigate.
 * Returns false if already in progress.
 * On synchronous assign failure, releases the guard and returns false.
 */
export function beginAdminSignOut(
  assign: (url: string) => void = (url) => {
    window.location.assign(url);
  }
): boolean {
  if (signOutStarted) return false;
  signOutStarted = true;
  try {
    assign(ADMIN_LOGOUT_PATH);
    return true;
  } catch {
    signOutStarted = false;
    return false;
  }
}

/** Informational account label from verified auth flags only. */
export function adminRoleLabel(flags: {
  isOwner?: boolean;
  isBranchScoped?: boolean;
}): string {
  if (flags.isOwner === true) return 'Owner';
  if (flags.isBranchScoped === true) return 'Branch administrator';
  return 'Administrator';
}
