import { afterEach, describe, expect, it } from 'vitest';
import {
  computeExpiresAt,
  getDefaultOfferTtlMinutes,
  parsePositiveIntMinutes,
  resolveOfferTtlMinutes,
} from '../offerTtl';

describe('offer TTL', () => {
  afterEach(() => {
    delete process.env.DISPATCH_OFFER_TTL_MINUTES;
    delete process.env.DISPATCH_OFFER_TTL_MINUTES_URGENT;
  });

  it('reads STANDARD and SAME_DAY from env, not hardcoded call sites', () => {
    const env = {
      DISPATCH_OFFER_TTL_MINUTES: '90',
      DISPATCH_OFFER_TTL_MINUTES_URGENT: '15',
    };
    expect(getDefaultOfferTtlMinutes('STANDARD', env)).toBe(90);
    expect(getDefaultOfferTtlMinutes('SAME_DAY', env)).toBe(15);
    expect(getDefaultOfferTtlMinutes('URGENT', env)).toBe(15);
  });

  it('falls back to 30 minutes for SAME_DAY only when urgent env is unset', () => {
    expect(getDefaultOfferTtlMinutes('SAME_DAY', {})).toBe(30);
    expect(getDefaultOfferTtlMinutes('STANDARD', {})).toBe(120);
  });

  it('allows a per-offer override', () => {
    expect(
      resolveOfferTtlMinutes({
        urgency: 'SAME_DAY',
        ttlMinutes: 7,
        env: { DISPATCH_OFFER_TTL_MINUTES_URGENT: '30' },
      })
    ).toBe(7);
  });

  it('ignores invalid env and uses fallback', () => {
    expect(parsePositiveIntMinutes('abc', 30)).toBe(30);
    expect(parsePositiveIntMinutes('0', 30)).toBe(30);
    expect(parsePositiveIntMinutes('-5', 30)).toBe(30);
  });

  it('computes expiresAt from offeredAt + minutes', () => {
    const offeredAt = new Date('2026-08-28T12:00:00.000Z');
    expect(computeExpiresAt(offeredAt, 30).toISOString()).toBe(
      '2026-08-28T12:30:00.000Z'
    );
  });
});
