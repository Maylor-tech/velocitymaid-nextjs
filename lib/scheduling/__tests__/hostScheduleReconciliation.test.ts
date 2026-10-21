import { describe, expect, it } from 'vitest';
import { businessDateKey, easternDateKey } from '@/lib/dates/serviceDate';
import {
  BUSINESS_ZONE,
  CHRIS_CHIPMAN_RESERVATIONS_2026_10_20,
  reconcileHostSchedule,
  serviceDayKey,
  type ScheduleJob,
} from '@/lib/scheduling/hostScheduleReconciliation';

const CUSTOMER = '0f548adf-01fe-48dc-a595-60ac8ab44493';
const PROPERTY = 'cde8f5da3bbc7c7de40411e42';
const TODAY = '2026-10-21';

function job(partial: Partial<ScheduleJob> & Pick<ScheduleJob, 'id' | 'serviceDate' | 'status'>): ScheduleJob {
  return {
    customerId: CUSTOMER,
    propertyId: PROPERTY,
    totalPrice: '300',
    paymentStatus: 'PENDING',
    hasInvoice: false,
    hasCalendarEvent: false,
    assignedCleanerId: null,
    guestCheckIn: null,
    guestCheckOut: null,
    preferredTime: null,
    ...partial,
  };
}

function reconcile(jobs: ScheduleJob[], today = TODAY) {
  return reconcileHostSchedule({
    reservations: CHRIS_CHIPMAN_RESERVATIONS_2026_10_20,
    jobs,
    customerId: CUSTOMER,
    propertyId: PROPERTY,
    today,
    timeZone: BUSINESS_ZONE,
  });
}

describe('Chipman schedule reconciliation', () => {
  const novemberJob = job({
    id: 'b977916d-c1f4-4ed5-9473-8dc44d41cfc5',
    serviceDate: '2026-11-01',
    preferredTime: '8:00 PM',
    status: 'CONFIRMED',
    propertyId: null,
    totalPrice: '300',
  });
  const october21 = job({
    id: 'oct-21',
    jobReference: 'VM-EXISTING-1021',
    serviceDate: '2026-10-21',
    status: 'COMPLETED',
    hasInvoice: true,
    paymentStatus: 'PAID',
    totalPrice: '300',
  });
  const winterHold = job({
    id: 'f061dd6e-9a47-47d8-b3c1-c65db222d775',
    jobReference: 'VM-2026-0029',
    serviceDate: '2026-12-08',
    preferredTime: '10:00 AM',
    status: 'RECEIVED',
    totalPrice: null,
  });

  it('matches the November 1 job once and does not propose a second one', () => {
    const first = reconcile([novemberJob, october21, winterHold]);
    const row = first.rows.find((item) => item.reservationId === 2);
    expect(row?.classification).toBe('EXISTING — NEEDS REVIEW');
    expect(row?.jobIds).toEqual([novemberJob.id]);
    expect(first.proposedCreates.map((item) => item.proposedServiceDate)).not.toContain('2026-11-01');

    const again = reconcile([
      novemberJob,
      ...first.proposedCreates.map((proposal) =>
        job({
          id: `planned-${proposal.reservationId}`,
          serviceDate: proposal.proposedServiceDate,
          guestCheckIn: proposal.guestCheckIn,
          guestCheckOut: proposal.guestCheckOut,
          status: 'CONFIRMED',
          propertyId: PROPERTY,
          totalPrice: '300',
        })
      ),
    ]);
    expect(again.proposedCreates).toEqual([]);
    expect(again.rows.filter((item) => item.classification === 'DUPLICATE — INVESTIGATE')).toEqual([]);
  });

  it('matches the linked November 1 job without proposing another or billing it', () => {
    const linked = job({
      ...novemberJob,
      propertyId: PROPERTY,
      guestCheckIn: '2026-10-29',
      guestCheckOut: '2026-11-01',
    });
    const result = reconcile([linked, october21]);
    const row = result.rows.find((item) => item.reservationId === 2);
    expect(row?.classification).toBe('EXISTING — MATCHED');
    expect(row?.flags).toContain('existing-time-preserved');
    expect(result.proposedCreates.some((item) => item.proposedServiceDate === '2026-11-01')).toBe(false);
    expect(result.preservedJobIds).toContain(october21.id);
    expect(result.proposedCreates.every((item) => item.billingInitiated === false)).toBe(true);
  });

  it('treats two jobs for one reservation as a duplicate and does not create another', () => {
    const result = reconcile([
      job({ id: 'a', serviceDate: '2026-11-08', status: 'CONFIRMED', propertyId: null }),
      job({ id: 'b', serviceDate: '2026-11-08', status: 'RECEIVED', propertyId: null }),
    ]);
    const row = result.rows.find((item) => item.reservationId === 3);
    expect(row?.classification).toBe('DUPLICATE — INVESTIGATE');
    expect(row?.jobIds).toEqual(['a', 'b']);
    expect(result.proposedCreates.some((item) => item.reservationId === 3)).toBe(false);
  });

  it('keeps the customer and property on proposals and ignores another customer on the same day', () => {
    const result = reconcile([
      job({
        id: 'other-customer',
        customerId: 'someone-else',
        serviceDate: '2026-10-25',
        status: 'CONFIRMED',
      }),
    ]);
    const created = result.proposedCreates.find((item) => item.reservationId === 1);
    expect(created?.customerId).toBe(CUSTOMER);
    expect(created?.propertyId).toBe(PROPERTY);
    expect(created?.price).toBe('300');
    expect(result.preservedJobIds).toContain('other-customer');
  });

  it('preserves completed and unrelated jobs, including October 21', () => {
    const result = reconcile([october21, winterHold, novemberJob]);
    expect(result.preservedJobIds).toEqual(expect.arrayContaining([october21.id, winterHold.id]));
    expect(result.proposedCreates.map((item) => item.proposedServiceDate)).not.toContain('2026-10-21');
    expect(result.proposedCreates.map((item) => item.proposedServiceDate)).not.toContain('2026-12-08');
  });

  it('does not initiate billing, assignment, or notifications', () => {
    const result = reconcile([]);
    expect(result.proposedCreates.length).toBeGreaterThan(0);
    expect(result.proposedCreates.every((item) => item.billingInitiated === false)).toBe(true);
    expect(result.proposedCreates.every((item) => item.cleaner === null)).toBe(true);
    expect(result.proposedCreates.every((item) => item.notifications === false)).toBe(true);
    expect(result.proposedCreates.every((item) => item.status === null)).toBe(true);
    expect(result.planningStateSupported).toBe(false);
  });

  it('flags the December 31 stay for host confirmation and the January 1–2 gap', () => {
    const result = reconcile([novemberJob]);
    const newYear = result.rows.find((item) => item.reservationId === 8);
    const following = result.rows.find((item) => item.reservationId === 9);
    expect(newYear?.classification).toBe('HOST CONFIRMATION REQUIRED');
    expect(newYear?.flags).toContain('one-night-gap-before-next-stay');
    expect(result.proposedCreates.some((item) => item.reservationId === 8)).toBe(false);
    expect(following?.classification).toBe('MISSING — PROPOSE CREATE');
    expect(following?.flags).not.toContain('same-day-turnover');
  });

  it('holds a clean that lands on the next guest check-in', () => {
    const reservations = [
      {
        id: 8,
        guestCheckIn: '2026-12-31',
        guestCheckOut: '2027-01-01',
        proposedCleaningDate: '2027-01-02',
      },
      {
        id: 9,
        guestCheckIn: '2027-01-02',
        guestCheckOut: '2027-01-06',
        proposedCleaningDate: '2027-01-06',
      },
    ];
    const result = reconcileHostSchedule({
      reservations,
      jobs: [],
      customerId: CUSTOMER,
      propertyId: PROPERTY,
      today: TODAY,
    });
    expect(result.rows.find((item) => item.reservationId === 8)?.classification).toBe('CONFLICT — HOLD');
    expect(result.proposedCreates).toHaveLength(1);
  });

  it('reads UTC-midnight service dates in America/New_York without shifting the day', () => {
    const utcMidnight = new Date('2026-11-01T00:00:00.000Z');
    expect(serviceDayKey(utcMidnight, BUSINESS_ZONE)).toBe('2026-11-01');
    expect(businessDateKey(utcMidnight, BUSINESS_ZONE)).toBe('2026-11-01');
    expect(easternDateKey(utcMidnight, BUSINESS_ZONE)).toBe('2026-10-31');

    const eveningBeforeUtcDay = new Date('2026-11-02T01:30:00.000Z');
    expect(serviceDayKey(eveningBeforeUtcDay, BUSINESS_ZONE)).toBe('2026-11-01');
    expect(serviceDayKey('2026-11-01')).toBe('2026-11-01');
  });
});
