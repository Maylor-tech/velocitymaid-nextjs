import { describe, expect, it } from 'vitest';
import type { IcsEvent } from '../ics';
import { findNearMatchJob, planSync, type KnownEvent } from '../plan';

const ev = (uid: string, start: string, end: string, summary = 'Reserved'): IcsEvent => ({
  uid,
  start,
  end,
  summary,
  status: null,
});
const known = (uid: string, start: string, end: string, status: KnownEvent['status'] = 'ACTIVE'): KnownEvent => ({
  id: `row-${uid}`,
  uid,
  start,
  end,
  status,
  jobId: `job-${uid}`,
});
const TODAY = '2026-12-01';

describe('planSync', () => {
  it('creates new upcoming checkouts and flags same-day arrivals', () => {
    const plan = planSync(
      [ev('a', '2026-12-05', '2026-12-08'), ev('b', '2026-12-08', '2026-12-10'), ev('block', '2026-12-12', '2026-12-14', 'Blocked')],
      [],
      TODAY
    );
    expect(plan.create.map((s) => s.uid)).toEqual(['a', 'b']);
    expect(plan.create[0]).toMatchObject({ sameDayArrival: true, nextCheckIn: '2026-12-08' });
    expect(plan.create[1]).toMatchObject({ sameDayArrival: false, nextCheckIn: null });
  });

  it('ignores past checkouts and ones beyond the horizon', () => {
    const plan = planSync(
      [ev('past', '2026-11-20', '2026-11-25'), ev('far', '2027-08-01', '2027-08-05')],
      [],
      TODAY,
      180
    );
    expect(plan.create).toEqual([]);
  });

  it('is idempotent: a second run with the same feed changes nothing', () => {
    const plan = planSync([ev('a', '2026-12-05', '2026-12-08')], [known('a', '2026-12-05', '2026-12-08')], TODAY);
    expect(plan.create).toEqual([]);
    expect(plan.moved).toEqual([]);
    expect(plan.removed).toEqual([]);
    expect(plan.unchanged.map((k) => k.uid)).toEqual(['a']);
  });

  it('detects moved checkouts, removed stays and restored stays', () => {
    const plan = planSync(
      [ev('a', '2026-12-05', '2026-12-09'), ev('c', '2026-12-20', '2026-12-22')],
      [
        known('a', '2026-12-05', '2026-12-08'),
        known('b', '2026-12-10', '2026-12-12'),
        known('c', '2026-12-20', '2026-12-22', 'CANCELLED'),
        known('old', '2026-11-01', '2026-11-03'),
      ],
      TODAY
    );
    expect(plan.moved.map((m) => [m.known.uid, m.stay.end])).toEqual([['a', '2026-12-09']]);
    expect(plan.removed.map((k) => k.uid)).toEqual(['b']);
    expect(plan.restored.map((r) => r.known.uid)).toEqual(['c']);
  });

  it('does not remove anything when the feed suddenly comes back empty', () => {
    const plan = planSync(
      [],
      [known('a', '2026-12-05', '2026-12-08'), known('b', '2026-12-10', '2026-12-12')],
      TODAY
    );
    expect(plan.suspiciousEmpty).toBe(true);
    expect(plan.removed).toEqual([]);
  });

  it('still removes a single stay that disappears (normal cancellation)', () => {
    const plan = planSync([], [known('a', '2026-12-05', '2026-12-08')], TODAY);
    expect(plan.suspiciousEmpty).toBe(false);
    expect(plan.removed.map((k) => k.uid)).toEqual(['a']);
  });
});

describe('findNearMatchJob', () => {
  const jobs = [{ id: 'dec30', day: '2026-12-30' }];
  it('links a stay reported as ending one day after an existing clean', () => {
    expect(findNearMatchJob('2026-12-31', jobs, new Set(['2026-12-31']))?.id).toBe('dec30');
  });
  it('does not link when another stay in the feed ends on that clean day', () => {
    expect(findNearMatchJob('2026-12-31', jobs, new Set(['2026-12-30', '2026-12-31']))).toBeNull();
  });
  it('does not link two days apart', () => {
    expect(findNearMatchJob('2027-01-01', jobs, new Set())).toBeNull();
  });
});
