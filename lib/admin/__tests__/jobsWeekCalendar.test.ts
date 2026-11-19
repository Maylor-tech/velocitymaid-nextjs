import { describe, expect, it } from 'vitest';
import {
  buildWeekCalendarGrid,
  weekDayJobChipsFromJobs,
  weekDayLabelsFromJobs,
  weekDayVisibleChips,
  weekOfLabel,
} from '../jobsMonthlyWorkspace';
import { activeAdminNavItem } from '@/components/admin/shell/adminNav';

describe('buildWeekCalendarGrid', () => {
  it('returns Sunday–Saturday for an anchor mid-week', () => {
    const cells = buildWeekCalendarGrid('2026-11-18');
    expect(cells).toHaveLength(7);
    expect(cells[0].key).toBe('2026-11-15');
    expect(cells[6].key).toBe('2026-11-21');
    expect(cells.map((c) => c.dayOfMonth)).toEqual([15, 16, 17, 18, 19, 20, 21]);
  });
});

describe('weekDayVisibleChips', () => {
  it('shows up to two property chips then +N more', () => {
    expect(
      weekDayVisibleChips(['Lakeside cabin', 'Birch Cottage'], 2)
    ).toEqual({
      shown: ['Lakeside cabin', 'Birch Cottage'],
      moreLabel: null,
    });
    expect(
      weekDayVisibleChips(
        ['Lakeside cabin', 'Birch Cottage', 'Maple Ridge'],
        2
      )
    ).toEqual({
      shown: ['Lakeside cabin', 'Birch Cottage'],
      moreLabel: '+1 more',
    });
  });

  it('never uses ×N on the first property', () => {
    const { shown, moreLabel } = weekDayVisibleChips(
      ['Lakeside cabin', 'Birch Cottage'],
      2
    );
    expect(shown.join(' ')).not.toMatch(/×/);
    expect(moreLabel).toBeNull();
  });
});

describe('weekDayJobChipsFromJobs', () => {
  it('keeps full labels for every job on a day', () => {
    const chips = weekDayJobChipsFromJobs([
      {
        preferredDate: '2026-11-20T00:00:00.000Z',
        property: { name: 'Lakeside cabin' },
      },
      {
        preferredDate: '2026-11-20T00:00:00.000Z',
        property: { name: 'Birch Cottage' },
      },
    ]);
    expect(chips['2026-11-20']).toEqual(['Lakeside cabin', 'Birch Cottage']);
  });
});

describe('weekDayLabelsFromJobs', () => {
  it('returns the first property label only (no ×N)', () => {
    const labels = weekDayLabelsFromJobs([
      {
        preferredDate: '2026-11-20T00:00:00.000Z',
        property: { name: 'Lakeside cabin' },
      },
      {
        preferredDate: '2026-11-20T00:00:00.000Z',
        property: { name: 'Birch Cottage' },
      },
    ]);
    expect(labels['2026-11-20']).toBe('Lakeside cabin');
    expect(labels['2026-11-20']).not.toMatch(/×/);
  });
});

describe('weekOfLabel', () => {
  it('formats ordinal week copy', () => {
    expect(weekOfLabel('2026-11-15')).toBe('week of the 15th');
    expect(weekOfLabel('2026-11-01')).toBe('week of the 1st');
    expect(weekOfLabel('2026-11-02')).toBe('week of the 2nd');
    expect(weekOfLabel('2026-11-03')).toBe('week of the 3rd');
  });
});

describe('real /admin/jobs active matcher', () => {
  it('highlights Jobs & Calendar for the real jobs route', () => {
    expect(activeAdminNavItem('/admin/jobs')?.label).toBe('Jobs & Calendar');
    expect(activeAdminNavItem('/admin/jobs/new')?.label).toBe('Jobs & Calendar');
  });
});
