/** Unsigned admin_session="true" is never an admin session. */
export function allowLegacyAdminBypass(): boolean {
  return false;
}

export function isLegacyAdminSession(value: string | undefined): boolean {
  return value === "true";
}
