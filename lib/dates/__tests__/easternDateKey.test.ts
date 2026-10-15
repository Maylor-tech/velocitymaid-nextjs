import { describe, expect, it } from 'vitest';
import {
  addCalendarDayKey,
  easternDateKey,
  serviceDayRelativeToEastern,
} from '../serviceDate';

describe('easternDateKey', () => {
  it('uses America/New_York, not UTC, for wall-clock now', () => {
    // 13 Oct 2026 03:30 UTC = 12 Oct 2026 23:30 EDT
    expect(easternDateKey(new Date('2026-10-13T03:30:00.000Z'))).toBe('2026-10-12');
    // 13 Oct 2026 04:00 UTC = 13 Oct 2026 00:00 EDT
    expect(easternDateKey(new Date('2026-10-13T04:00:00.000Z'))).toBe('2026-10-13');
  });
});

describe('serviceDayRelativeToEastern for UTC-midnight preferredDate', () => {
  const oct13 = '2026-10-13T00:00:00.000Z';

  it('does not backshift Oct 13 UTC midnight to Oct 12 Eastern', () => {
    const morningEt = new Date('2026-10-13T12:40:00.000Z');
    expect(serviceDayRelativeToEastern(oct13, morningEt)).toBe('today');
  });

  it('is still future just before Eastern midnight on Oct 13', () => {
    expect(
      serviceDayRelativeToEastern(oct13, new Date('2026-10-13T03:59:00.000Z'))
    ).toBe('future');
  });
});

describe('addCalendarDayKey', () => {
  it('crosses month boundaries in UTC calendar space', () => {
    expect(addCalendarDayKey('2026-09-30', 1)).toBe('2026-10-01');
    expect(addCalendarDayKey('2026-10-01', -1)).toBe('2026-09-30');
  });
});
