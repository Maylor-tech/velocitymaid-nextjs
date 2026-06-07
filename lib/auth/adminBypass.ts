/** Legacy dev-only admin_session="true" bypass — disabled in production. */
export function allowLegacyAdminBypass(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function isLegacyAdminSession(value: string | undefined): boolean {
  return value === "true";
}
