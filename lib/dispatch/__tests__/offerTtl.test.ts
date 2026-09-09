import { afterEach, describe, expect, it } from 'vitest';
import {
  computeExpiresAt,
  getDefaultOfferTtlMinutes,
  inferOverrideUsed,
  parsePositiveIntMinutes,
  resolveOfferExpiration,
  resolveOfferTtlMinutes,
} from '../offerTtl';

const OFFERED_AT = new Date('2026-09-08T12:00:00.000Z');

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

  it('allows a per-offer override when no service date is present', () => {
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

describe('service-date-aware STANDARD TTL', () => {
  it('uses 24h when service is more than 48h away', () => {
    const ttl = resolveOfferExpiration({
      urgency: 'STANDARD',
      preferredDate: new Date('2026-09-15T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(ttl.hoursUntilService).toBeGreaterThan(48);
    expect(ttl.defaultMinutes).toBe(24 * 60);
    expect(ttl.ttlMinutes).toBe(24 * 60);
    expect(ttl.source).toBe('SERVICE_AWARE');
    expect(ttl.overrideUsed).toBe(false);
  });

  it('uses 8h when service is 24–48h away', () => {
    const ttl = resolveOfferExpiration({
      urgency: 'STANDARD',
      preferredDate: new Date('2026-09-10T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(ttl.hoursUntilService).toBeGreaterThanOrEqual(24);
    expect(ttl.hoursUntilService).toBeLessThanOrEqual(48);
    expect(ttl.defaultMinutes).toBe(8 * 60);
    expect(ttl.source).toBe('SERVICE_AWARE');
  });

  it('uses 2h when service is less than 24h away', () => {
    const ttl = resolveOfferExpiration({
      urgency: 'STANDARD',
      preferredDate: new Date('2026-09-09T00:00:00.000Z'),
      preferredTime: '06:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(ttl.hoursUntilService).toBeLessThan(24);
    expect(ttl.defaultMinutes).toBe(120);
    expect(ttl.source).toBe('URGENCY_DEFAULT');
  });

  it('keeps SAME_DAY / URGENT short even for a far-future service', () => {
    const sameDay = resolveOfferExpiration({
      urgency: 'SAME_DAY',
      preferredDate: new Date('2026-09-15T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(sameDay.defaultMinutes).toBe(30);
    expect(sameDay.source).toBe('URGENCY_DEFAULT');
    const urgent = resolveOfferExpiration({
      urgency: 'URGENT',
      preferredDate: new Date('2026-09-15T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(urgent.defaultMinutes).toBe(30);
  });

  it('lets an explicit override win before the safety clamp', () => {
    const ttl = resolveOfferExpiration({
      urgency: 'STANDARD',
      ttlMinutes: 45,
      preferredDate: new Date('2026-09-15T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(ttl.overrideUsed).toBe(true);
    expect(ttl.source).toBe('OVERRIDE');
    expect(ttl.ttlMinutes).toBe(45);
    expect(ttl.defaultMinutes).toBe(24 * 60);
  });

  it('reads 10:00 AM on a UTC-midnight service date without local-day shift', () => {
    const ttl = resolveOfferExpiration({
      urgency: 'STANDARD',
      preferredDate: '2026-09-15T00:00:00.000Z',
      preferredTime: '10:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(ttl.hoursUntilService).toBeCloseTo(166, 0);
  });

  it('never lets expiry run past the safety cutoff before service', () => {
    const ttl = resolveOfferExpiration({
      urgency: 'STANDARD',
      ttlMinutes: 10_000,
      preferredDate: new Date('2026-09-09T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      offeredAt: OFFERED_AT,
      env: {},
    });
    expect(ttl.clampedToSafetyCutoff).toBe(true);
    expect(ttl.expiresAt.toISOString()).toBe('2026-09-09T09:00:00.000Z');
    expect(ttl.expiresAt.getTime()).toBeLessThan(
      new Date('2026-09-09T10:00:00.000Z').getTime()
    );
  });

  it('inferOverrideUsed is true when applied duration differs from default', () => {
    expect(
      inferOverrideUsed(
        '2026-09-08T12:00:00.000Z',
        '2026-09-08T12:45:00.000Z',
        1440
      )
    ).toBe(true);
    expect(
      inferOverrideUsed(
        '2026-09-08T12:00:00.000Z',
        '2026-09-09T12:00:00.000Z',
        1440
      )
    ).toBe(false);
  });
});
