import { describe, expect, it } from 'vitest';
import {
  addCalendarMonthKey,
  buildMonthCalendarGrid,
  computeMonthlySummary,
  isUnknownServiceTime,
  monthDateBounds,
  sortJobsDeterministic,
} from '../jobsMonthlyWorkspace';

describe('jobsMonthlyWorkspace', () => {
  it('navigates Dec→Jan and Jan→Feb year/month boundaries', () => {
    expect(addCalendarMonthKey('2025-12', 1)).toBe('2026-01');
    expect(addCalendarMonthKey('2026-01', 1)).toBe('2026-02');
    expect(addCalendarMonthKey('2026-01', -1)).toBe('2025-12');
  });

  it('handles month-end and leap-year February bounds', () => {
    const feb2024 = monthDateBounds('2024-02');
    expect(feb2024.startKey).toBe('2024-02-01');
    expect(feb2024.endKeyInclusive).toBe('2024-02-29');

    const feb2025 = monthDateBounds('2025-02');
    expect(feb2025.endKeyInclusive).toBe('2025-02-28');

    const jan = monthDateBounds('2026-01');
    expect(jan.endKeyInclusive).toBe('2026-01-31');
  });

  it('builds a Sunday-first calendar grid without shifting UTC dates', () => {
    const cells = buildMonthCalendarGrid('2026-01', new Date('2026-01-15T15:00:00Z'));
    const inMonth = cells.filter((c) => c.inMonth);
    expect(inMonth[0].key).toBe('2026-01-01');
    expect(inMonth[inMonth.length - 1].key).toBe('2026-01-31');
    expect(cells.find((c) => c.key === '2026-01-15')?.isToday).toBe(true);
  });

  it('sorts by service date, time (unknown last), then id', () => {
    const sorted = sortJobsDeterministic([
      { id: 'b', preferredDate: '2026-01-02T00:00:00.000Z', preferredTime: null },
      { id: 'a', preferredDate: '2026-01-01T00:00:00.000Z', preferredTime: '10:00 AM' },
      { id: 'c', preferredDate: '2026-01-01T00:00:00.000Z', preferredTime: '09:00 AM' },
      { id: 'd', preferredDate: null, preferredTime: '08:00 AM' },
    ]);
    expect(sorted.map((j) => j.id)).toEqual(['c', 'a', 'b', 'd']);
    expect(isUnknownServiceTime(null)).toBe(true);
    expect(isUnknownServiceTime('  ')).toBe(true);
    expect(isUnknownServiceTime('9 AM')).toBe(false);
  });

  it('separates requests, confirmed, cancelled, qc, and unassigned demand', () => {
    const summary = computeMonthlySummary(
      [
        { status: 'RECEIVED', preferredDate: '2026-01-10T00:00:00.000Z', totalPrice: 100 },
        {
          status: 'CONFIRMED',
          preferredDate: '2026-01-11T00:00:00.000Z',
          assignedCleanerId: null,
          totalPrice: 200,
        },
        {
          status: 'ASSIGNED',
          preferredDate: '2026-01-12T00:00:00.000Z',
          assignedCleanerId: 'c1',
          quotedTotal: 150,
        },
        { status: 'AWAITING_QC', preferredDate: '2026-01-13T00:00:00.000Z', totalPrice: 90 },
        { status: 'COMPLETED', preferredDate: '2026-01-05T00:00:00.000Z', totalPrice: 80 },
        { status: 'CANCELLED', preferredDate: '2026-01-06T00:00:00.000Z', totalPrice: 70 },
        { status: 'CONFIRMED', preferredDate: null, assignedCleanerId: null },
      ],
      new Date('2026-01-08T15:00:00Z')
    );

    expect(summary.bookingRequests).toBe(1);
    expect(summary.cancelledJobs).toBe(1);
    expect(summary.qcPendingJobs).toBe(1);
    expect(summary.completedServiceJobs).toBe(1);
    expect(summary.unscheduledJobs).toBe(1);
    expect(summary.unassignedConfirmedDemand).toBe(2);
    expect(summary.missingPrice).toBe(1);
    expect(summary.collectedRevenue).toBe('unavailable');
    expect(summary.outstandingInvoices).toBe('unavailable');
  });
});
