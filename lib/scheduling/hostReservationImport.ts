/**
 * Reservation import planning. Extends host-schedule reconciliation.
 *
 * This module decides which HostReservation rows to insert or update.
 * It never creates a Job, invoice, offer, calendar event, or notification.
 */
import { addCalendarDayKey, easternDateKey } from '@/lib/dates/serviceDate';
import { parsePreferredTimeWindow } from '@/lib/dates/preferredClock';
import {
  BUSINESS_ZONE,
  reconcileHostSchedule,
  type ScheduleJob,
  type ScheduleReservation,
} from '@/lib/scheduling/hostScheduleReconciliation';

export const ALLOWED_NON_SAME_DAY_WINDOW = '7:00 AM - 8:00 PM';

export const HOST_RESERVATION_STATUSES = [
  'UNCONFIRMED',
  'HOST_CONFIRMATION_REQUIRED',
  'CONFIRMED',
  'HELD',
  'CANCELLED',
] as const;

export type HostReservationStatus = (typeof HOST_RESERVATION_STATUSES)[number];

export const IMPORT_CLASSIFICATIONS = [
  'CREATE',
  'UNCHANGED',
  'UPDATE',
  'CHANGED_DATES',
  'DUPLICATE',
  'CONFLICT — HOLD',
  'HOST CONFIRMATION REQUIRED',
  'REACTIVATE',
  'LINK_EXISTING_JOB',
  'INVALID',
] as const;

export type ImportClassification = (typeof IMPORT_CLASSIFICATIONS)[number];

export type ReservationImportRow = {
  sourceLineKey: string;
  guestCheckIn: string;
  guestCheckOut: string;
  proposedCleaningDate: string;
  proposedCleaningWindow?: string | null;
  bookingSource?: string | null;
  hostConfirmationRequired?: boolean;
};

export type StoredReservation = {
  id: string;
  customerId: string;
  propertyId: string;
  guestCheckIn: string;
  guestCheckOut: string;
  proposedCleaningDate: string | null;
  proposedCleaningWindow: string | null;
  bookingSource: string | null;
  status: HostReservationStatus;
  jobId: string | null;
  sourceDocumentRef: string | null;
  sourceLineKey: string | null;
};

export type ReservationWrite = {
  action: 'create' | 'update';
  reservationId: string | null;
  sourceLineKey: string;
  customerId: string;
  propertyId: string;
  guestCheckIn: string;
  guestCheckOut: string;
  proposedCleaningDate: string;
  proposedCleaningWindow: string | null;
  bookingSource: string | null;
  status: HostReservationStatus;
  jobId: string | null;
  sourceDocumentRef: string;
  eventAction: 'CREATED' | 'UPDATED' | 'DATE_CHANGED' | 'JOB_LINKED' | 'REACTIVATED';
  before: Record<string, unknown> | null;
};

export type ImportPreviewRow = {
  sourceLineKey: string;
  classification: ImportClassification;
  reservationId: string | null;
  suggestedJobId: string | null;
  flags: string[];
  plannedStatus: HostReservationStatus | null;
  apply: boolean;
};

export type ReservationImportPreview = {
  rows: ImportPreviewRow[];
  writes: ReservationWrite[];
  preservedJobIds: string[];
  /** Stored reservations the import did not match. They are left in place. */
  untouchedStoredIds: string[];
  /** Always empty. Import planning must not create cleaning jobs. */
  jobCreates: [];
  createsJobs: false;
  sideEffects: [];
};

export type ImportOptions = {
  acceptDateChanges?: boolean;
  linkExistingJobs?: boolean;
  reactivateCancelled?: boolean;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function utcMidnightFromDateKey(day: string): Date {
  if (!DATE_KEY.test(day)) throw new Error(`Invalid reservation date: ${day}`);
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

function isDateKey(value: string | null | undefined): value is string {
  return !!value && DATE_KEY.test(value);
}

function nightsOverlap(checkIn: string, checkOut: string, otherIn: string, otherOut: string): boolean {
  return checkIn < otherOut && otherIn < checkOut;
}

function deadlinePlaceholder(window: string | null | undefined): boolean {
  if (!window?.trim()) return false;
  const parsed = parsePreferredTimeWindow(window);
  return !!parsed && !parsed.end;
}

function storedSnapshot(row: StoredReservation): Record<string, unknown> {
  return {
    guestCheckIn: row.guestCheckIn,
    guestCheckOut: row.guestCheckOut,
    proposedCleaningDate: row.proposedCleaningDate,
    proposedCleaningWindow: row.proposedCleaningWindow,
    bookingSource: row.bookingSource,
    status: row.status,
    jobId: row.jobId,
    sourceLineKey: row.sourceLineKey,
  };
}

function desiredStatus(
  hostConfirmationRequired: boolean | undefined,
  conflict: boolean
): HostReservationStatus {
  if (hostConfirmationRequired) return 'HOST_CONFIRMATION_REQUIRED';
  if (conflict) return 'HELD';
  return 'UNCONFIRMED';
}

function classificationForNew(status: HostReservationStatus): ImportClassification {
  if (status === 'HOST_CONFIRMATION_REQUIRED') return 'HOST CONFIRMATION REQUIRED';
  if (status === 'HELD') return 'CONFLICT — HOLD';
  return 'CREATE';
}

function safeWindow(window: string | null | undefined, storedWindow: string | null): string | null {
  if (deadlinePlaceholder(window)) return storedWindow;
  const trimmed = window?.trim();
  return trimmed ? trimmed : storedWindow;
}

export function previewReservationImport(input: {
  incoming: ReservationImportRow[];
  stored: StoredReservation[];
  jobs: ScheduleJob[];
  customerId: string;
  propertyId: string;
  sourceDocumentRef: string;
  today?: string;
  timeZone?: string;
  options?: ImportOptions;
}): ReservationImportPreview {
  const options = input.options ?? {};
  const timeZone = input.timeZone ?? BUSINESS_ZONE;
  const today = input.today ?? easternDateKey(new Date(), timeZone);
  const propertyRows = input.stored.filter((row) => row.propertyId === input.propertyId);
  const schedule: ScheduleReservation[] = input.incoming.map((row, index) => ({
    id: index + 1,
    guestCheckIn: row.guestCheckIn,
    guestCheckOut: row.guestCheckOut,
    proposedCleaningDate: row.proposedCleaningDate,
    hostConfirmationRequired: row.hostConfirmationRequired,
  }));
  const jobRecon = reconcileHostSchedule({
    reservations: schedule,
    jobs: input.jobs,
    customerId: input.customerId,
    propertyId: input.propertyId,
    today,
    timeZone,
    source: input.sourceDocumentRef,
  });

  const dateCounts = new Map<string, number>();
  for (const row of input.incoming) {
    const key = `${row.guestCheckIn}|${row.guestCheckOut}`;
    dateCounts.set(key, (dateCounts.get(key) ?? 0) + 1);
  }

  const rows: ImportPreviewRow[] = [];
  const writes: ReservationWrite[] = [];

  input.incoming.forEach((row, index) => {
    const flags = [...(jobRecon.rows[index]?.flags ?? [])];
    const jobIds = jobRecon.rows[index]?.jobIds ?? [];
    const suggestedJobId = jobIds.length === 1 ? jobIds[0] : null;
    if (jobIds.length > 1) flags.push('duplicate-jobs');
    if (deadlinePlaceholder(row.proposedCleaningWindow)) flags.push('deadline-placeholder');
    if (addCalendarDayKey(today, 7) > row.proposedCleaningDate && !flags.includes('inside-seven-day-access-notice')) {
      flags.push('inside-seven-day-access-notice');
    }

    const invalid =
      !isDateKey(row.guestCheckIn) ||
      !isDateKey(row.guestCheckOut) ||
      !isDateKey(row.proposedCleaningDate) ||
      row.guestCheckIn >= row.guestCheckOut ||
      !row.sourceLineKey.trim();
    if (invalid) {
      rows.push({
        sourceLineKey: row.sourceLineKey,
        classification: 'INVALID',
        reservationId: null,
        suggestedJobId: null,
        flags: [...flags, 'invalid-dates'],
        plannedStatus: null,
        apply: false,
      });
      return;
    }

    if ((dateCounts.get(`${row.guestCheckIn}|${row.guestCheckOut}`) ?? 0) > 1) {
      rows.push({
        sourceLineKey: row.sourceLineKey,
        classification: 'DUPLICATE',
        reservationId: null,
        suggestedJobId,
        flags: [...flags, 'duplicate-in-import'],
        plannedStatus: null,
        apply: false,
      });
      return;
    }

    const exact = propertyRows.filter(
      (stored) => stored.guestCheckIn === row.guestCheckIn && stored.guestCheckOut === row.guestCheckOut
    );
    const byLine = propertyRows.filter(
      (stored) =>
        stored.sourceDocumentRef === input.sourceDocumentRef &&
        stored.sourceLineKey === row.sourceLineKey &&
        !exact.some((match) => match.id === stored.id)
    );
    const conflict = flags.some((flag) =>
      ['same-day-turnover', 'shared-cleaning-date', 'clean-lands-on-next-arrival'].includes(flag)
    );
    const nextStatus = desiredStatus(row.hostConfirmationRequired, conflict);

    if (exact.length > 1) {
      rows.push({
        sourceLineKey: row.sourceLineKey,
        classification: 'DUPLICATE',
        reservationId: null,
        suggestedJobId,
        flags: [...flags, 'duplicate-stored'],
        plannedStatus: null,
        apply: false,
      });
      return;
    }

    const lineMatch = byLine.length === 1 ? byLine[0] : null;
    if (byLine.length > 1) {
      rows.push({
        sourceLineKey: row.sourceLineKey,
        classification: 'DUPLICATE',
        reservationId: null,
        suggestedJobId,
        flags: [...flags, 'duplicate-source-line'],
        plannedStatus: null,
        apply: false,
      });
      return;
    }

    if (!exact[0] && lineMatch && (lineMatch.guestCheckIn !== row.guestCheckIn || lineMatch.guestCheckOut !== row.guestCheckOut)) {
      const collides = propertyRows.some(
        (stored) =>
          stored.id !== lineMatch.id &&
          (stored.guestCheckIn === row.guestCheckIn && stored.guestCheckOut === row.guestCheckOut ||
            nightsOverlap(row.guestCheckIn, row.guestCheckOut, stored.guestCheckIn, stored.guestCheckOut))
      );
      const apply = !!options.acceptDateChanges && !collides && lineMatch.status !== 'CONFIRMED';
      if (collides) flags.push('date-change-collides');
      if (lineMatch.status === 'CONFIRMED') flags.push('confirmed-stay-preserved');
      if (lineMatch.jobId) flags.push('linked-job-preserved');
      rows.push({
        sourceLineKey: row.sourceLineKey,
        classification: 'CHANGED_DATES',
        reservationId: lineMatch.id,
        suggestedJobId: lineMatch.jobId ?? suggestedJobId,
        flags,
        plannedStatus: lineMatch.status,
        apply,
      });
      if (apply) {
        writes.push(writeFrom(input, row, lineMatch, nextStatus === 'UNCONFIRMED' ? lineMatch.status : nextStatus, 'DATE_CHANGED', options, suggestedJobId));
      }
      return;
    }

    const stored = exact[0];
    if (!stored) {
      const overlapping = propertyRows.some((existing) =>
        nightsOverlap(row.guestCheckIn, row.guestCheckOut, existing.guestCheckIn, existing.guestCheckOut)
      );
      if (overlapping) flags.push('overlaps-stored-stay');
      const status = overlapping ? 'HELD' : nextStatus;
      const classification = overlapping ? 'CONFLICT — HOLD' : classificationForNew(status);
      rows.push({
        sourceLineKey: row.sourceLineKey,
        classification,
        reservationId: null,
        suggestedJobId,
        flags,
        plannedStatus: status,
        apply: true,
      });
      writes.push(writeFrom(input, row, null, status, 'CREATED', options, suggestedJobId));
      return;
    }

    if (stored.status === 'CANCELLED') {
      const apply = !!options.reactivateCancelled;
      rows.push({
        sourceLineKey: row.sourceLineKey,
        classification: 'REACTIVATE',
        reservationId: stored.id,
        suggestedJobId: stored.jobId ?? suggestedJobId,
        flags: [...flags, 'cancelled-reservation-preserved'],
        plannedStatus: nextStatus,
        apply,
      });
      if (apply) writes.push(writeFrom(input, row, stored, nextStatus, 'REACTIVATED', options, suggestedJobId));
      return;
    }

    const protectedStatus =
      stored.status === 'CONFIRMED' || stored.status === 'HOST_CONFIRMATION_REQUIRED' || stored.status === 'HELD'
        ? stored.status
        : nextStatus;
    const windowValue = safeWindow(row.proposedCleaningWindow, stored.proposedCleaningWindow);
    const planChanged =
      stored.proposedCleaningDate !== row.proposedCleaningDate ||
      stored.proposedCleaningWindow !== windowValue ||
      (stored.bookingSource ?? null) !== (row.bookingSource ?? stored.bookingSource ?? null) ||
      stored.sourceLineKey !== row.sourceLineKey ||
      (stored.status === 'UNCONFIRMED' && protectedStatus !== 'UNCONFIRMED');
    const canLink = !!options.linkExistingJobs && !stored.jobId && !!suggestedJobId;

    let classification: ImportClassification = 'UNCHANGED';
    if (canLink && !planChanged) classification = 'LINK_EXISTING_JOB';
    else if (conflict) classification = 'CONFLICT — HOLD';
    else if (protectedStatus === 'HOST_CONFIRMATION_REQUIRED' && stored.status !== 'HOST_CONFIRMATION_REQUIRED') {
      classification = 'HOST CONFIRMATION REQUIRED';
    } else if (stored.status === 'HOST_CONFIRMATION_REQUIRED') classification = 'HOST CONFIRMATION REQUIRED';
    else if (planChanged) classification = 'UPDATE';

    const apply = planChanged || (classification === 'LINK_EXISTING_JOB' && canLink);
    if (stored.jobId) flags.push('linked-job-preserved');
    if (stored.status === 'CONFIRMED' && nextStatus !== 'CONFIRMED') flags.push('confirmation-preserved');
    rows.push({
      sourceLineKey: row.sourceLineKey,
      classification,
      reservationId: stored.id,
      suggestedJobId: stored.jobId ?? suggestedJobId,
      flags,
      plannedStatus: protectedStatus,
      apply,
    });
    if (apply) {
      writes.push(
        writeFrom(
          input,
          { ...row, proposedCleaningWindow: windowValue },
          stored,
          protectedStatus,
          canLink && !planChanged ? 'JOB_LINKED' : 'UPDATED',
          options,
          suggestedJobId
        )
      );
    }
  });

  const touched = new Set(rows.map((row) => row.reservationId).filter((id): id is string => !!id));
  return {
    rows,
    writes,
    preservedJobIds: jobRecon.preservedJobIds,
    untouchedStoredIds: propertyRows.filter((row) => !touched.has(row.id)).map((row) => row.id),
    jobCreates: [],
    createsJobs: false,
    sideEffects: [],
  };
}

function writeFrom(
  input: {
    customerId: string;
    propertyId: string;
    sourceDocumentRef: string;
    options?: ImportOptions;
  },
  row: ReservationImportRow,
  stored: StoredReservation | null,
  status: HostReservationStatus,
  eventAction: ReservationWrite['eventAction'],
  options: ImportOptions,
  suggestedJobId: string | null
): ReservationWrite {
  const link = !!options.linkExistingJobs && !stored?.jobId && !!suggestedJobId;
  return {
    action: stored ? 'update' : 'create',
    reservationId: stored?.id ?? null,
    sourceLineKey: row.sourceLineKey,
    customerId: input.customerId,
    propertyId: input.propertyId,
    guestCheckIn: row.guestCheckIn,
    guestCheckOut: row.guestCheckOut,
    proposedCleaningDate: row.proposedCleaningDate,
    proposedCleaningWindow: deadlinePlaceholder(row.proposedCleaningWindow)
      ? stored?.proposedCleaningWindow ?? null
      : row.proposedCleaningWindow?.trim() || stored?.proposedCleaningWindow || null,
    bookingSource: row.bookingSource ?? stored?.bookingSource ?? null,
    status,
    jobId: stored?.jobId ?? (link ? suggestedJobId : null),
    sourceDocumentRef: input.sourceDocumentRef,
    eventAction: link && eventAction === 'UPDATED' ? 'JOB_LINKED' : eventAction,
    before: stored ? storedSnapshot(stored) : null,
  };
}

export function reservationNeedsJob(status: HostReservationStatus, jobId: string | null): boolean {
  return !jobId && status !== 'CANCELLED' && status !== 'HELD' && status !== 'HOST_CONFIRMATION_REQUIRED';
}

export type ReservationLayers = {
  guestReservation: string;
  cleaningPlan: string;
  cleaningJob: string;
  isCleanerAssignment: false;
  needsJob: boolean;
};

/** UI copy. A reservation is never itself a cleaner assignment. */
export function describeReservationLayers(input: {
  guestCheckIn: string;
  guestCheckOut: string;
  proposedCleaningDate: string | null;
  proposedCleaningWindow: string | null;
  status: HostReservationStatus;
  jobReference: string | null;
  jobStatus: string | null;
}): ReservationLayers {
  const windowText = input.proposedCleaningWindow?.trim() || 'Allowed window not recorded';
  const planDate = input.proposedCleaningDate ?? 'No proposed cleaning date';
  const confirmed = input.status === 'CONFIRMED';
  return {
    guestReservation: `${input.guestCheckIn} to ${input.guestCheckOut}`,
    cleaningPlan: confirmed
      ? `Confirmed access window ${planDate}, ${windowText}`
      : `Proposed only ${planDate}, ${windowText}`,
    cleaningJob: input.jobReference
      ? `Linked job ${input.jobReference} (${input.jobStatus ?? 'status unknown'})`
      : 'No cleaning job yet',
    isCleanerAssignment: false,
    needsJob: reservationNeedsJob(input.status, input.jobReference ? 'linked' : null),
  };
}
