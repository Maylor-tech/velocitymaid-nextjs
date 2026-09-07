/**
 * Dispatch environment gates. Preview/local must not create offers against
 * the shared production database. Production activation is a separate
 * human-owned env change — this module does not turn the flag on.
 */

/** Production Supabase project ref. Never migrate/seed this from staging scripts. */
export const PRODUCTION_SUPABASE_PROJECT_REF = 'chsahtnpwssyfrqzcncz';

export function isVercelProduction(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.VERCEL_ENV === 'production';
}

export function isDispatchStaging(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.DISPATCH_STAGING === 'true';
}

export function isStagingDatabaseConfirmed(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.DISPATCH_STAGING_DB_CONFIRMED === 'true';
}

/**
 * True when DATABASE_URL / DIRECT_URL / NEXT_PUBLIC_SUPABASE_URL contain
 * the known Production Supabase project ref. Does not print URLs.
 */
export function databaseLooksLikeProduction(
  env: Record<string, string | undefined> = process.env
): boolean {
  const haystacks = [
    env.DATABASE_URL,
    env.DIRECT_URL,
    env.NEXT_PUBLIC_SUPABASE_URL,
  ];
  return haystacks.some(
    (value) => typeof value === 'string' && value.includes(PRODUCTION_SUPABASE_PROJECT_REF)
  );
}

/**
 * True when offer mutations are allowed to run.
 * Production: allowed (flag still required at the API).
 * Preview/local: allowed only after an isolated staging DB is confirmed.
 */
export function canMutateDispatchOffers(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (env.DISPATCH_OFFERS_VERMONT !== 'true') return true;
  if (isVercelProduction(env)) return true;
  return isStagingDatabaseConfirmed(env);
}

export function dispatchMutationBlockReason(
  env: Record<string, string | undefined> = process.env
): string | null {
  if (canMutateDispatchOffers(env)) return null;
  return 'Dispatch offers are blocked until Preview/local uses an isolated staging database (DISPATCH_STAGING_DB_CONFIRMED=true).';
}

export function stagingScriptRefuseReason(
  env: Record<string, string | undefined> = process.env
): string | null {
  if (databaseLooksLikeProduction(env)) {
    return 'Refusing: DATABASE_URL/DIRECT_URL/NEXT_PUBLIC_SUPABASE_URL resolve to Production';
  }
  if (isVercelProduction(env) && !isDispatchStaging(env)) {
    return 'Refusing: VERCEL_ENV=production without DISPATCH_STAGING=true';
  }
  if (!isDispatchStaging(env)) {
    return 'Set DISPATCH_STAGING=true';
  }
  if (!isStagingDatabaseConfirmed(env)) {
    return 'Set DISPATCH_STAGING_DB_CONFIRMED=true after Preview uses staging DATABASE_URL';
  }
  return null;
}
