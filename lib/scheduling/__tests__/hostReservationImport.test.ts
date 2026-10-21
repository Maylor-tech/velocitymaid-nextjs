import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { businessDateKey, easternDateKey } from '@/lib/dates/serviceDate';
import {
  BUSINESS_ZONE,
  CHRIS_CHIPMAN_RESERVATIONS_2026_10_20,
  serviceDayKey,
} from '@/lib/scheduling/hostScheduleReconciliation';
import {
  describeReservationLayers,
  previewReservationImport,
  utcMidnightFromDateKey,
  type ReservationImportRow,
  type ReservationWrite,
  type StoredReservation,
} from '@/lib/scheduling/hostReservationImport';
import { applyReservationWrites } from '@/lib/scheduling/hostReservationStore';
import type { ScheduleJob } from '@/lib/scheduling/hostScheduleReconciliation';

const CUSTOMER = '0f548adf-01fe-48dc-a595-60ac8ab44493';
const PROPERTY = 'cde8f5da3bbc7c7de40411e42';
const SOURCE = 'Chris schedule dated 2026-10-20';
const TODAY = '2026-10-21';

function incomingFromChris(rows = CHRIS_CHIPMAN_RESERVATIONS_2026_10_20): ReservationImportRow[] {
  return rows.map((row) => ({
    sourceLineKey: String(row.id),
    guestCheckIn: row.guestCheckIn,
    guestCheckOut: row.guestCheckOut,
    proposedCleaningDate: row.proposedCleaningDate,
    hostConfirmationRequired: row.hostConfirmationRequired,
  }));
}

function novemberJob(): ScheduleJob {
  return {
    id: 'b977916d-c1f4-4ed5-9473-8dc44d41cfc5',
    customerId: CUSTOMER,
    propertyId: PROPERTY,
    serviceDate: '2026-11-01',
    preferredTime: '8:00 PM',
    guestCheckIn: '2026-10-29',
    guestCheckOut: '2026-11-01',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    totalPrice: '300',
    hasInvoice: false,
    hasCalendarEvent: false,
    assignedCleanerId: null,
  };
}

function preview(extra?: {
  incoming?: ReservationImportRow[];
  stored?: StoredReservation[];
  jobs?: ScheduleJob[];
  options?: { acceptDateChanges?: boolean; linkExistingJobs?: boolean; reactivateCancelled?: boolean };
}) {
  return previewReservationImport({
    incoming: extra?.incoming ?? incomingFromChris(),
    stored: extra?.stored ?? [],
    jobs: extra?.jobs ?? [novemberJob()],
    customerId: CUSTOMER,
    propertyId: PROPERTY,
    sourceDocumentRef: SOURCE,
    today: TODAY,
    timeZone: BUSINESS_ZONE,
    options: extra?.options,
  });
}

function materialize(writes: ReservationWrite[]): StoredReservation[] {
  return writes.map((write, index) => ({
    id: write.reservationId ?? `planned-${index + 1}`,
    customerId: write.customerId,
    propertyId: write.propertyId,
    guestCheckIn: write.guestCheckIn,
    guestCheckOut: write.guestCheckOut,
    proposedCleaningDate: write.proposedCleaningDate,
    proposedCleaningWindow: write.proposedCleaningWindow,
    bookingSource: write.bookingSource,
    status: write.status,
    jobId: write.jobId,
    sourceDocumentRef: write.sourceDocumentRef,
    sourceLineKey: write.sourceLineKey,
  }));
}

describe('host reservation import', () => {
  it('previews the Chipman stays without creating jobs', () => {
    const result = preview();
    expect(result.createsJobs).toBe(false);
    expect(result.jobCreates).toEqual([]);
    expect(result.sideEffects).toEqual([]);
    expect(result.writes.every((write) => write.jobId === null)).toBe(true);
    const october = result.rows.find((row) => row.sourceLineKey === '1');
    expect(october?.classification).toBe('CREATE');
    expect(october?.flags).toContain('inside-seven-day-access-notice');
    expect(october?.apply).toBe(true);
    const november = result.rows.find((row) => row.sourceLineKey === '2');
    expect(november?.suggestedJobId).toBe(novemberJob().id);
    expect(result.writes.find((write) => write.sourceLineKey === '2')?.jobId).toBeNull();
  });

  it('treats a repeated import as unchanged and leaves stored rows in place', () => {
    const first = preview();
    const stored = materialize(first.writes);
    stored.push({
      id: 'historical-stay',
      customerId: CUSTOMER,
      propertyId: PROPERTY,
      guestCheckIn: '2026-06-01',
      guestCheckOut: '2026-06-04',
      proposedCleaningDate: '2026-06-04',
      proposedCleaningWindow: null,
      bookingSource: 'Earlier schedule',
      status: 'CONFIRMED',
      jobId: 'existing-june-job',
      sourceDocumentRef: 'older',
      sourceLineKey: 'june',
    });
    const second = preview({ stored });
    expect(second.writes).toEqual([]);
    expect(second.untouchedStoredIds).toContain('historical-stay');
    expect(second.rows.find((row) => row.sourceLineKey === '8')?.classification).toBe(
      'HOST CONFIRMATION REQUIRED'
    );
    expect(second.rows.find((row) => row.sourceLineKey === '8')?.apply).toBe(false);
  });

  it('detects duplicate rows in one import', () => {
    const row = incomingFromChris()[2];
    const result = preview({ incoming: [row, { ...row }] });
    expect(result.rows.every((item) => item.classification === 'DUPLICATE')).toBe(true);
    expect(result.writes).toEqual([]);
  });

  it('holds a date correction for manual review and does not create a second stay', () => {
    const stored: StoredReservation = {
      id: 'stay-8',
      customerId: CUSTOMER,
      propertyId: PROPERTY,
      guestCheckIn: '2026-12-31',
      guestCheckOut: '2027-01-01',
      proposedCleaningDate: '2027-01-01',
      proposedCleaningWindow: null,
      bookingSource: 'Airbnb',
      status: 'HOST_CONFIRMATION_REQUIRED',
      jobId: 'linked-job',
      sourceDocumentRef: SOURCE,
      sourceLineKey: '8',
    };
    const incoming: ReservationImportRow[] = [
      {
        sourceLineKey: '8',
        guestCheckIn: '2026-12-30',
        guestCheckOut: '2027-01-01',
        proposedCleaningDate: '2027-01-01',
        bookingSource: 'Airbnb',
        hostConfirmationRequired: true,
      },
    ];
    const held = preview({ incoming, stored: [stored], jobs: [], options: { acceptDateChanges: true } });
    expect(held.rows[0]?.classification).toBe('CHANGED_DATES');
    expect(held.rows[0]?.flags).toContain('manual-review-required');
    expect(held.writes).toEqual([]);
    expect(held.rows[0]?.reservationId).toBe('stay-8');
  });

  it('does not guess when the same line key is used by another booking source', () => {
    const stored: StoredReservation = {
      id: 'stay-vrbo',
      customerId: CUSTOMER,
      propertyId: PROPERTY,
      guestCheckIn: '2026-11-05',
      guestCheckOut: '2026-11-08',
      proposedCleaningDate: '2026-11-08',
      proposedCleaningWindow: null,
      bookingSource: 'VRBO',
      status: 'UNCONFIRMED',
      jobId: null,
      sourceDocumentRef: SOURCE,
      sourceLineKey: '3',
    };
    const result = preview({
      stored: [stored],
      jobs: [],
      incoming: [
        {
          sourceLineKey: '3',
          guestCheckIn: '2026-11-13',
          guestCheckOut: '2026-11-15',
          proposedCleaningDate: '2026-11-15',
          bookingSource: 'Airbnb',
        },
      ],
    });
    expect(result.rows[0]?.flags).toContain('ambiguous-source-identity');
    expect(result.writes).toEqual([]);
  });

  it('keeps a reordered line key from rewriting the stay it lands on', () => {
    const stored: StoredReservation[] = [
      {
        id: 'stay-a',
        customerId: CUSTOMER,
        propertyId: PROPERTY,
        guestCheckIn: '2026-10-23',
        guestCheckOut: '2026-10-25',
        proposedCleaningDate: '2026-10-25',
        proposedCleaningWindow: null,
        bookingSource: null,
        status: 'UNCONFIRMED',
        jobId: null,
        sourceDocumentRef: SOURCE,
        sourceLineKey: '1',
      },
    ];
    const result = preview({
      stored,
      jobs: [],
      incoming: [
        {
          sourceLineKey: '9',
          guestCheckIn: '2026-10-23',
          guestCheckOut: '2026-10-25',
          proposedCleaningDate: '2026-10-25',
        },
      ],
    });
    expect(result.writes).toEqual([]);
    expect(result.rows[0]?.flags).toContain('source-line-conflicts');
    expect(result.rows[0]?.reservationId).toBe('stay-a');
  });

  it('does not rewrite a confirmed reservation from an import', () => {
    const stored: StoredReservation = {
      id: 'stay-confirmed',
      customerId: CUSTOMER,
      propertyId: PROPERTY,
      guestCheckIn: '2026-11-05',
      guestCheckOut: '2026-11-08',
      proposedCleaningDate: '2026-11-08',
      proposedCleaningWindow: '7:00 AM - 8:00 PM',
      bookingSource: null,
      status: 'CONFIRMED',
      jobId: 'job-confirmed',
      sourceDocumentRef: SOURCE,
      sourceLineKey: '3',
    };
    const result = preview({
      stored: [stored],
      jobs: [],
      incoming: [
        {
          sourceLineKey: '3',
          guestCheckIn: '2026-11-05',
          guestCheckOut: '2026-11-08',
          proposedCleaningDate: '2026-11-09',
          proposedCleaningWindow: '9:00 AM - 1:00 PM',
        },
      ],
    });
    expect(result.writes).toEqual([]);
    expect(result.rows[0]?.flags).toContain('confirmed-stay-preserved');
    expect(result.rows[0]?.reservationId).toBe('stay-confirmed');
  });

  it('keeps the January 1 stay on hold and does not treat January 2 as a same-day turn', () => {
    const result = preview({ jobs: [] });
    const newYear = result.rows.find((row) => row.sourceLineKey === '8');
    const following = result.rows.find((row) => row.sourceLineKey === '9');
    expect(newYear?.classification).toBe('HOST CONFIRMATION REQUIRED');
    expect(newYear?.plannedStatus).toBe('HOST_CONFIRMATION_REQUIRED');
    expect(newYear?.flags).toContain('one-night-gap-before-next-stay');
    expect(newYear?.flags).not.toContain('same-day-turnover');
    expect(following?.classification).toBe('CREATE');
    expect(result.writes.find((write) => write.sourceLineKey === '9')?.proposedCleaningDate).toBe('2027-01-06');

    const landsOnArrival = preview({
      jobs: [],
      incoming: [
        {
          sourceLineKey: '8',
          guestCheckIn: '2026-12-31',
          guestCheckOut: '2027-01-01',
          proposedCleaningDate: '2027-01-02',
        },
        {
          sourceLineKey: '9',
          guestCheckIn: '2027-01-02',
          guestCheckOut: '2027-01-06',
          proposedCleaningDate: '2027-01-06',
        },
      ],
    });
    expect(landsOnArrival.rows.find((row) => row.sourceLineKey === '8')?.classification).toBe('CONFLICT — HOLD');
    expect(landsOnArrival.writes.find((write) => write.sourceLineKey === '8')?.status).toBe('HELD');
    expect(landsOnArrival.jobCreates).toEqual([]);
  });

  it('can associate an existing job without creating one', () => {
    const linked = preview({ options: { linkExistingJobs: true } });
    expect(linked.writes.find((write) => write.sourceLineKey === '2')).toMatchObject({
      jobId: novemberJob().id,
      action: 'create',
    });
    expect(linked.jobCreates).toEqual([]);
  });

  it('preserves unrelated jobs and does not store an 8:00 PM deadline as the window', () => {
    const winter: ScheduleJob = {
      id: 'f061dd6e-9a47-47d8-b3c1-c65db222d775',
      jobReference: 'VM-2026-0029',
      customerId: CUSTOMER,
      propertyId: PROPERTY,
      serviceDate: '2026-12-08',
      status: 'RECEIVED',
      preferredTime: '10:00 AM',
      totalPrice: null,
    };
    const result = preview({
      jobs: [novemberJob(), winter],
      incoming: incomingFromChris().map((row) =>
        row.sourceLineKey === '1' ? { ...row, proposedCleaningWindow: '8:00 PM' } : row
      ),
    });
    expect(result.preservedJobIds).toContain(winter.id);
    expect(result.writes.some((write) => write.jobId === winter.id)).toBe(false);
    const october = result.rows.find((row) => row.sourceLineKey === '1');
    expect(october?.flags).toContain('deadline-placeholder');
    expect(result.writes.find((write) => write.sourceLineKey === '1')?.proposedCleaningWindow).toBeNull();
  });

  it('keeps Vermont calendar days on UTC-midnight reservation dates', () => {
    const utcMidnight = utcMidnightFromDateKey('2026-11-01');
    expect(utcMidnight.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(serviceDayKey(utcMidnight, BUSINESS_ZONE)).toBe('2026-11-01');
    expect(businessDateKey(utcMidnight, BUSINESS_ZONE)).toBe('2026-11-01');
    expect(easternDateKey(utcMidnight, BUSINESS_ZONE)).toBe('2026-10-31');
    expect(serviceDayKey('2026-11-02T01:30:00.000Z', BUSINESS_ZONE)).toBe('2026-11-01');
  });

  it('describes an unconfirmed stay as a plan, not a cleaner assignment', () => {
    const layers = describeReservationLayers({
      guestCheckIn: '2026-10-23',
      guestCheckOut: '2026-10-25',
      proposedCleaningDate: '2026-10-25',
      proposedCleaningWindow: null,
      status: 'UNCONFIRMED',
      jobReference: null,
      jobStatus: null,
    });
    expect(layers.isCleanerAssignment).toBe(false);
    expect(layers.needsJob).toBe(true);
    expect(layers.cleaningPlan.startsWith('Proposed only')).toBe(true);
    expect(layers.cleaningJob).toBe('No cleaning job yet');
  });

  it('writes reservation rows and history without touching jobs', async () => {
    const calls: string[] = [];
    const db = {
      $transaction: async <T,>(fn: (tx: never) => Promise<T>) =>
        fn({
          hostReservation: {
            create: async () => {
              calls.push('reservation.create');
              return { id: 'res-1' };
            },
            update: async () => {
              calls.push('reservation.update');
              return { id: 'res-1' };
            },
          },
          hostReservationEvent: {
            create: async () => {
              calls.push('event.create');
              return { id: 'event-1' };
            },
          },
          job: {
            create: async () => {
              throw new Error('job create');
            },
            update: async () => {
              throw new Error('job update');
            },
          },
        } as never),
    };
    const result = await applyReservationWrites(db, preview().writes.slice(0, 1));
    expect(result).toEqual({ created: 1, updated: 0 });
    expect(calls).toEqual(['reservation.create', 'event.create']);
  });

  it('keeps reservation modules off operational services', () => {
    const store = readFileSync('lib/scheduling/hostReservationStore.ts', 'utf8');
    const route = readFileSync('app/api/admin/properties/[propertyId]/reservations/route.ts', 'utf8');
    const patch = readFileSync(
      'app/api/admin/properties/[propertyId]/reservations/[reservationId]/route.ts',
      'utf8'
    );
    for (const source of [store, route, patch]) {
      expect(source).not.toMatch(/from ['"]@\/lib\/(email|google|invoices|stripe)/);
      expect(source).not.toMatch(/\b(job|invoice|jobOffer)\.(create|update|delete)\b/);
      expect(source).not.toMatch(/upsertJobCalendarEvent|sendEmail|sendAdminNotification|stripe\./);
    }
  });
});
