import { describe, expect, it } from 'vitest';
import {
  canMutateDispatchOffers,
  databaseLooksLikeProduction,
  dispatchMutationBlockReason,
  isStagingDatabaseConfirmed,
  PRODUCTION_SUPABASE_PROJECT_REF,
  stagingScriptRefuseReason,
} from '../environmentSafety';

describe('dispatch environment safety', () => {
  it('allows mutations when the Vermont flag is off', () => {
    expect(canMutateDispatchOffers({})).toBe(true);
    expect(canMutateDispatchOffers({ DISPATCH_OFFERS_VERMONT: 'false' })).toBe(true);
  });

  it('blocks Preview/local flag-on until staging DB is confirmed', () => {
    const env = {
      DISPATCH_OFFERS_VERMONT: 'true',
      VERCEL_ENV: 'preview',
    };
    expect(canMutateDispatchOffers(env)).toBe(false);
    expect(dispatchMutationBlockReason(env)).toMatch(/isolated staging database/i);
  });

  it('allows Preview after DISPATCH_STAGING_DB_CONFIRMED=true', () => {
    expect(
      canMutateDispatchOffers({
        DISPATCH_OFFERS_VERMONT: 'true',
        VERCEL_ENV: 'preview',
        DISPATCH_STAGING_DB_CONFIRMED: 'true',
      })
    ).toBe(true);
    expect(isStagingDatabaseConfirmed({ DISPATCH_STAGING_DB_CONFIRMED: 'true' })).toBe(true);
  });

  it('does not add an extra production block (activation remains a human env change)', () => {
    expect(
      canMutateDispatchOffers({
        DISPATCH_OFFERS_VERMONT: 'true',
        VERCEL_ENV: 'production',
      })
    ).toBe(true);
  });

  it('detects the known Production Supabase project ref without needing the secret URL', () => {
    expect(
      databaseLooksLikeProduction({
        DATABASE_URL: `postgresql://postgres.${PRODUCTION_SUPABASE_PROJECT_REF}:x@host/db`,
      })
    ).toBe(true);
    expect(
      databaseLooksLikeProduction({
        DATABASE_URL: 'postgresql://postgres.stagingref:x@host/db',
      })
    ).toBe(false);
  });

  it('refuses staging scripts against Production URLs even when staging flags are set', () => {
    expect(
      stagingScriptRefuseReason({
        DISPATCH_STAGING: 'true',
        DISPATCH_STAGING_DB_CONFIRMED: 'true',
        DATABASE_URL: `postgresql://postgres.${PRODUCTION_SUPABASE_PROJECT_REF}:x@host/db`,
      })
    ).toMatch(/Production/);
  });
});
