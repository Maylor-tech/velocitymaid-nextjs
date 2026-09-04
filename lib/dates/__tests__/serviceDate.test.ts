import { describe, expect, it } from 'vitest';
import {
  formatCalendarDate,
  formatConfirmedSchedule,
  formatServiceDate,
  invoiceServiceDateFromJob,
  isSameServiceDay,
  parseServiceDateInput,
  serviceDateKey,
} from '../serviceDate';

describe('parseServiceDateInput', () => {
  it('parses YYYY-MM-DD as UTC midnight of that calendar day', () => {
    const d = parseServiceDateInput('2026-09-15');
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe('2026-09-15T00:00:00.000Z');
  });

  it('rejects invalid calendar dates', () => {
    expect(parseServiceDateInput('2026-02-31')).toBeNull();
    expect(parseServiceDateInput('not-a-date')).toBeNull();
    expect(parseServiceDateInput('')).toBeNull();
  });

  it('normalizes ISO instants to UTC calendar midnight', () => {
    const d = parseServiceDateInput('2026-09-15T14:30:00.000Z');
    expect(d!.toISOString()).toBe('2026-09-15T00:00:00.000Z');
  });
});

describe('formatServiceDate', () => {
  it('renders UTC-midnight preferredDate as September 15 (no local day shift)', () => {
    // 2026-09-15T00:00:00.000Z is evening Sep 14 in US timezones when formatted locally.
    expect(
      formatServiceDate('2026-09-15T00:00:00.000Z', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    ).toBe('September 15, 2026');
  });

  it('keeps noon-UTC seeded dates on the same calendar day', () => {
    expect(
      formatServiceDate('2026-09-15T12:00:00.000Z', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    ).toBe('September 15, 2026');
  });

  it('matches weekday for the UTC calendar day', () => {
    // 2026-09-15 is a Tuesday.
    expect(
      formatServiceDate('2026-09-15T00:00:00.000Z', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    ).toBe('Tuesday, September 15, 2026');
  });
});

describe('serviceDateKey', () => {
  it('returns YYYY-MM-DD from UTC midnight storage', () => {
    expect(serviceDateKey('2026-09-15T00:00:00.000Z')).toBe('2026-09-15');
  });
});

describe('formatConfirmedSchedule', () => {
  it('keeps August 30 at 10:00 AM (no local day shift)', () => {
    const schedule = formatConfirmedSchedule(
      '2026-08-30T00:00:00.000Z',
      '10:00 AM'
    );
    expect(schedule.dateLabel).toBe('Sunday, August 30, 2026');
    expect(schedule.timeLabel).toBe('10:00 AM');
    expect(schedule.combined).toContain('10:00 AM');
  });
});

describe('invoiceServiceDateFromJob', () => {
  it('uses preferredDate UTC midnight, not next-day completedAt', () => {
    const jobDate = invoiceServiceDateFromJob(
      '2026-08-25T00:00:00.000Z',
      new Date('2026-08-26T16:00:34.594Z')
    );
    expect(jobDate.toISOString()).toBe('2026-08-25T00:00:00.000Z');
    expect(isSameServiceDay(jobDate, '2026-08-25T00:00:00.000Z')).toBe(true);
  });

  it('falls back to the business day of completedAt when preferredDate is missing', () => {
    const jobDate = invoiceServiceDateFromJob(
      null,
      new Date('2026-08-26T16:00:34.594Z')
    );
    expect(jobDate.toISOString()).toBe('2026-08-26T00:00:00.000Z');
  });

  it('does not roll a Vermont evening completion onto the next UTC calendar day', () => {
    // 2026-08-26T03:30:00.000Z is 11:30pm Aug 25 in America/New_York.
    const jobDate = invoiceServiceDateFromJob(
      null,
      new Date('2026-08-26T03:30:00.000Z')
    );
    expect(jobDate.toISOString()).toBe('2026-08-25T00:00:00.000Z');
  });
});

describe('formatCalendarDate', () => {
  it('does not backtrack UTC-midnight service days in US timezones', () => {
    expect(formatCalendarDate('2026-08-25T00:00:00.000Z')).toBe('August 25, 2026');
  });

  it('renders Vermont-afternoon wall-clock stamps on the Eastern calendar day', () => {
    expect(formatCalendarDate('2026-08-26T16:00:34.594Z')).toBe('August 26, 2026');
  });
});
