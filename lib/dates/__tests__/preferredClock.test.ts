/**
 * Regression tests for the canonical America/New_York scheduling contract.
 * Includes VM-2026-0038 (12:00–15:30 must not render as 08:00 EDT).
 */
import { describe, expect, it } from 'vitest';
import {
  hoursUntilService,
  parsePreferredClockTime,
  parsePreferredTimeWindow,
  resolveServiceStart,
  resolveServiceWindow,
  zonedWallTimeToUtc,
} from '../preferredClock';

describe('parsePreferredClockTime / parsePreferredTimeWindow', () => {
  it('parses 24h, 12h AM/PM, and range starts; rejects labels', () => {
    expect(parsePreferredClockTime('14:30')).toEqual({ hours: 14, minutes: 30 });
    expect(parsePreferredClockTime('2:00 PM')).toEqual({ hours: 14, minutes: 0 });
    expect(parsePreferredClockTime('12:00 AM')).toEqual({ hours: 0, minutes: 0 });
    expect(parsePreferredClockTime('12:00 PM')).toEqual({ hours: 12, minutes: 0 });
    expect(parsePreferredClockTime('10:00 - 12:00')).toEqual({ hours: 10, minutes: 0 });
    expect(parsePreferredClockTime('Morning')).toBeNull();
    expect(parsePreferredClockTime('Afternoon')).toBeNull();
    expect(parsePreferredClockTime(null)).toBeNull();
  });

  it('parses range ends for Calendar duration', () => {
    expect(parsePreferredTimeWindow('12:00 - 15:30')).toEqual({
      start: { hours: 12, minutes: 0 },
      end: { hours: 15, minutes: 30 },
    });
    expect(parsePreferredTimeWindow('2:00 PM - 4:30 PM')).toEqual({
      start: { hours: 14, minutes: 0 },
      end: { hours: 16, minutes: 30 },
    });
    expect(parsePreferredTimeWindow('10:00')).toEqual({
      start: { hours: 10, minutes: 0 },
      end: null,
    });
    expect(parsePreferredTimeWindow('Morning')).toBeNull();
  });
});

describe('zonedWallTimeToUtc — EST/EDT', () => {
  it('maps noon Eastern during EDT to 16:00Z', () => {
    // 2026-09-15 is daylight time (EDT, UTC-4)
    expect(
      zonedWallTimeToUtc(2026, 9, 15, 12, 0, 'America/New_York').toISOString()
    ).toBe('2026-09-15T16:00:00.000Z');
  });

  it('maps noon Eastern during EST to 17:00Z', () => {
    // 2026-01-15 is standard time (EST, UTC-5)
    expect(
      zonedWallTimeToUtc(2026, 1, 15, 12, 0, 'America/New_York').toISOString()
    ).toBe('2026-01-15T17:00:00.000Z');
  });
});

describe('resolveServiceWindow — VM-2026-0038 and defaults', () => {
  it('VM-2026-0038: 12:00 - 15:30 Eastern renders 12:00–15:30 local (not 08:00 EDT)', () => {
    // Historical bug: setUTCHours(12) → 12:00Z = 08:00 EDT.
    const window = resolveServiceWindow(
      new Date('2026-09-20T00:00:00.000Z'),
      '12:00 - 15:30'
    );
    expect(window).not.toBeNull();
    expect(window!.start.toISOString()).toBe('2026-09-20T16:00:00.000Z');
    expect(window!.end.toISOString()).toBe('2026-09-20T19:30:00.000Z');
    expect(window!.hasParsedClock).toBe(true);
    expect(window!.hasParsedEnd).toBe(true);
    expect(window!.allDay).toBe(false);

    // Wall-clock sanity in America/New_York
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    expect(fmt.format(window!.start)).toBe('12:00');
    expect(fmt.format(window!.end)).toBe('15:30');
  });

  it('uses a 2-hour default for a single start time', () => {
    const window = resolveServiceWindow(
      new Date('2026-09-15T00:00:00.000Z'),
      '10:00 AM'
    );
    expect(window!.start!.toISOString()).toBe('2026-09-15T14:00:00.000Z');
    expect(window!.end!.toISOString()).toBe('2026-09-15T16:00:00.000Z');
    expect(window!.hasParsedEnd).toBe(false);
  });

  it('Morning is all-day: no fabricated midnight–2am timed window', () => {
    const window = resolveServiceWindow(
      new Date('2026-09-15T00:00:00.000Z'),
      'Morning'
    );
    expect(window!.allDay).toBe(true);
    expect(window!.hasParsedClock).toBe(false);
    expect(window!.start).toBeNull();
    expect(window!.end).toBeNull();
    expect(window!.serviceDateKey).toBe('2026-09-15');
  });

  it('empty preferredTime is all-day on the service date', () => {
    const window = resolveServiceWindow(
      new Date('2026-09-15T00:00:00.000Z'),
      null
    );
    expect(window!.allDay).toBe(true);
    expect(window!.serviceDateKey).toBe('2026-09-15');
  });

  it('handles 24-hour range values', () => {
    const window = resolveServiceWindow(
      new Date('2026-01-20T00:00:00.000Z'),
      '09:00 - 11:30'
    );
    // EST: 09:00 → 14:00Z, 11:30 → 16:30Z
    expect(window!.start!.toISOString()).toBe('2026-01-20T14:00:00.000Z');
    expect(window!.end!.toISOString()).toBe('2026-01-20T16:30:00.000Z');
  });

  it('rolls end to the next local day when the range crosses midnight', () => {
    const window = resolveServiceWindow(
      new Date('2026-09-15T00:00:00.000Z'),
      '23:00 - 01:00'
    );
    expect(window!.start!.toISOString()).toBe('2026-09-16T03:00:00.000Z');
    expect(window!.end!.toISOString()).toBe('2026-09-16T05:00:00.000Z');
  });

  it('keeps EST vs EDT distinct for the same wall clock', () => {
    const edt = resolveServiceStart(
      new Date('2026-07-15T00:00:00.000Z'),
      '12:00'
    );
    const est = resolveServiceStart(
      new Date('2026-12-15T00:00:00.000Z'),
      '12:00'
    );
    expect(edt!.toISOString()).toBe('2026-07-15T16:00:00.000Z');
    expect(est!.toISOString()).toBe('2026-12-15T17:00:00.000Z');
  });
});

describe('resolveServiceStart / hoursUntilService', () => {
  it('aligns service-start reasoning with Calendar (EDT wall time)', () => {
    const start = resolveServiceStart(
      '2026-09-15T00:00:00.000Z',
      '10:00 AM'
    );
    expect(start!.toISOString()).toBe('2026-09-15T14:00:00.000Z');

    const hours = hoursUntilService(
      '2026-09-15T00:00:00.000Z',
      '10:00 AM',
      new Date('2026-09-08T12:00:00.000Z')
    );
    // Sep 8 12:00Z → Sep 15 14:00Z = 170h
    expect(hours).toBeCloseTo(170, 5);
  });

  it('Morning: resolveServiceStart is null (no fabricated midnight)', () => {
    expect(
      resolveServiceStart(new Date('2026-09-15T00:00:00.000Z'), 'Morning')
    ).toBeNull();
    expect(
      resolveServiceStart(new Date('2026-09-15T00:00:00.000Z'), null)
    ).toBeNull();
  });

  it('Morning: hoursUntilService still uses the service day for horizon banding', () => {
    // Local midnight EDT Sep 15 = 04:00Z; from Sep 8 12:00Z ≈ 160h
    const hours = hoursUntilService(
      new Date('2026-09-15T00:00:00.000Z'),
      'Morning',
      new Date('2026-09-08T12:00:00.000Z')
    );
    expect(hours).toBeCloseTo(160, 0);
  });
});
