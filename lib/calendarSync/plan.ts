/**
 * Pure decision step for one calendar feed: what changed since last sync.
 * No database or network here, so it is easy to test.
 */
import { isReservation, type IcsEvent } from './ics';

/** How far ahead we create turnovers. */
export const SYNC_HORIZON_DAYS = 180;

export type KnownEvent = {
  id: string;
  uid: string;
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD */
  end: string;
  status: 'ACTIVE' | 'CANCELLED';
  jobId: string | null;
};

export type PlannedStay = IcsEvent & {
  /** Next arrival on the checkout day (same-day turnover), if any. */
  sameDayArrival: boolean;
  /** Next guest check-in day after this checkout, if the feed shows one. */
  nextCheckIn: string | null;
};

export type SyncPlan = {
  /** New stays: create a turnover request. */
  create: PlannedStay[];
  /** Stays we know whose dates moved. */
  moved: Array<{ known: KnownEvent; stay: PlannedStay }>;
  /** Stays we knew that are gone from the feed (cancelled or moved off). */
  removed: KnownEvent[];
  /** Previously removed stays that came back. */
  restored: Array<{ known: KnownEvent; stay: PlannedStay }>;
  /** Known stays still present and unchanged (refresh lastSeenAt). */
  unchanged: KnownEvent[];
  /**
   * True when the feed suddenly lists nothing while we still expect several
   * upcoming stays: likely a platform outage or a changed link. No removals
   * are made in that case.
   */
  suspiciousEmpty: boolean;
};

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function planSync(
  feedEvents: IcsEvent[],
  known: KnownEvent[],
  today: string,
  horizonDays = SYNC_HORIZON_DAYS
): SyncPlan {
  const lastDay = addDays(today, horizonDays);
  const stays = feedEvents.filter(isReservation);
  const arrivals = stays.map((s) => s.start).sort();

  const upcoming: PlannedStay[] = stays
    .filter((s) => s.end >= today && s.end <= lastDay)
    .map((s) => ({
      ...s,
      sameDayArrival: arrivals.includes(s.end),
      nextCheckIn: arrivals.find((a) => a >= s.end) ?? null,
    }));

  const byUid = new Map(upcoming.map((s) => [s.uid, s]));
  const knownByUid = new Map(known.map((k) => [k.uid, k]));
  const expectedUpcoming = known.filter(
    (k) => k.status === 'ACTIVE' && k.end >= today
  );
  const suspiciousEmpty = upcoming.length === 0 && expectedUpcoming.length >= 2;

  const plan: SyncPlan = {
    create: [],
    moved: [],
    removed: [],
    restored: [],
    unchanged: [],
    suspiciousEmpty,
  };

  for (const stay of upcoming) {
    const k = knownByUid.get(stay.uid);
    if (!k) {
      plan.create.push(stay);
    } else if (k.status === 'CANCELLED') {
      plan.restored.push({ known: k, stay });
    } else if (k.end !== stay.end || k.start !== stay.start) {
      plan.moved.push({ known: k, stay });
    } else {
      plan.unchanged.push(k);
    }
  }

  if (!suspiciousEmpty) {
    for (const k of expectedUpcoming) {
      if (!byUid.has(k.uid)) plan.removed.push(k);
    }
  }
  return plan;
}

/**
 * A stay whose checkout is one day off an existing open clean usually means the
 * platform reports the dates slightly differently (e.g. a blocked gap night), not
 * a second stay. Link to that clean instead of creating a duplicate, unless the
 * feed itself has another stay ending on the clean's day (then it is a real,
 * separate turnover).
 */
export function findNearMatchJob(
  stayEnd: string,
  candidates: Array<{ id: string; day: string }>,
  feedCheckoutDays: Set<string>
): { id: string; day: string } | null {
  const near = [addDays(stayEnd, -1), addDays(stayEnd, 1)];
  for (const day of near) {
    if (feedCheckoutDays.has(day)) continue;
    const hit = candidates.find((c) => c.day === day);
    if (hit) return hit;
  }
  return null;
}
