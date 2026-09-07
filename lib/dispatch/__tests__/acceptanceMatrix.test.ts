import { describe, expect, it } from 'vitest';
import { isDispatchOffersFlagOn } from '../featureFlags';
import { canMutateDispatchOffers } from '../environmentSafety';
import { effectiveOfferStatus, shouldRejectMutationAsExpired } from '../offerExpiry';
import { resolveSafeEmailRecipient } from '@/lib/notifications/outboundSafety';

/**
 * Maps the Phase F acceptance cases to automated coverage.
 * Live Preview E2E against an isolated staging DB is a separate human step.
 */
describe('dispatch acceptance matrix (automated)', () => {
  it('12. feature flag OFF blocks offer creation at the env gate', () => {
    expect(isDispatchOffersFlagOn({})).toBe(false);
    expect(isDispatchOffersFlagOn({ DISPATCH_OFFERS_VERMONT: 'false' })).toBe(false);
  });

  it('8/9/10. timestamp expiry rejects accept and surfaces EXPIRED before cron', () => {
    const stale = { status: 'OFFERED', expiresAt: '2020-01-01T00:00:00.000Z' };
    const now = new Date('2026-09-06T17:00:00.000Z');
    expect(effectiveOfferStatus(stale, now)).toBe('EXPIRED');
    expect(shouldRejectMutationAsExpired(stale, now)).toBe(true);
  });

  it('17. Preview/staging does not send real cleaner email by default', () => {
    const d = resolveSafeEmailRecipient('real.cleaner@velocitymaid.com', {
      VERCEL_ENV: 'preview',
    });
    expect(d.allowed).toBe(false);
  });

  it('Preview flag-on without staging DB confirmation is blocked', () => {
    expect(
      canMutateDispatchOffers({
        DISPATCH_OFFERS_VERMONT: 'true',
        VERCEL_ENV: 'preview',
      })
    ).toBe(false);
  });
});
