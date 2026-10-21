/**
 * Dry-run reconciliation of a host reservation list against existing jobs.
 * Pure: it does not write, bill, assign, or notify.
 * Reservation import planning lives in hostReservationImport.ts and never creates jobs.
 *
 * Service dates follow lib/dates/serviceDate.ts. UTC-midnight preferredDate
 * values keep their UTC calendar day. America/New_York is the business zone
 * for real wall-clock timestamps, not for those date-only values.
 */
import { addCalendarDayKey, businessDateKey, easternDateKey } from '@/lib/dates/serviceDate';

export const BUSINESS_ZONE = 'America/New_York';

export const RECONCILIATION_CLASSIFICATIONS = [
  'EXISTING — MATCHED',
  'EXISTING — NEEDS REVIEW',
  'MISSING — PROPOSE CREATE',
  'DUPLICATE — INVESTIGATE',
  'CONFLICT — HOLD',
  'HOST CONFIRMATION REQUIRED',
] as const;

export type ReconciliationClassification = (typeof RECONCILIATION_CLASSIFICATIONS)[number];

export type ScheduleReservation = {
  id: number;
  guestCheckIn: string;
  guestCheckOut: string;
  proposedCleaningDate: string;
  hostConfirmationRequired?: boolean;
};

export type ScheduleJob = {
  id: string;
  jobReference?: string | null;
  customerId?: string | null;
  propertyId?: string | null;
  serviceDate: string | null;
  preferredTime?: string | null;
  guestCheckIn?: string | null;
  guestCheckOut?: string | null;
  status: string;
  paymentStatus?: string | null;
  totalPrice?: string | null;
  hasInvoice?: boolean;
  hasCalendarEvent?: boolean;
  assignedCleanerId?: string | null;
};

export type ProposedTurnover = {
  reservationId: number;
  customerId: string;
  propertyId: string;
  serviceType: 'Vacation Rental Turnover';
  proposedServiceDate: string;
  guestCheckIn: string;
  guestCheckOut: string;
  price: string;
  window: string;
  source: string;
  cleaner: null;
  billingInitiated: false;
  notifications: false;
  /** No JobStatus is safe to write. Null means do not insert. */
  status: null;
  blockedReason: string;
};

export type ReconciliationRow = {
  reservationId: number;
  classification: ReconciliationClassification;
  jobIds: string[];
  flags: string[];
};

export type ReconciliationResult = {
  rows: ReconciliationRow[];
  proposedCreates: ProposedTurnover[];
  preservedJobIds: string[];
  planningStateSupported: false;
  planningStateReason: string;
};

const PLANNING_STATE_REASON =
  'JobStatus has no unconfirmed planning value. RECEIVED and CONFIRMED are live operational states, so missing turnovers are proposed only and must not be inserted.';

const NON_SAME_DAY_WINDOW =
  'Unconfirmed. Non-same-day work may be proposed between 7:00 AM and 8:00 PM America/New_York, subject to host confirmation.';

const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY']);

export const CHRIS_CHIPMAN_RESERVATIONS_2026_10_20: ScheduleReservation[] = [
  { id: 1, guestCheckIn: '2026-10-23', guestCheckOut: '2026-10-25', proposedCleaningDate: '2026-10-25' },
  { id: 2, guestCheckIn: '2026-10-29', guestCheckOut: '2026-11-01', proposedCleaningDate: '2026-11-01' },
  { id: 3, guestCheckIn: '2026-11-05', guestCheckOut: '2026-11-08', proposedCleaningDate: '2026-11-08' },
  { id: 4, guestCheckIn: '2026-11-13', guestCheckOut: '2026-11-15', proposedCleaningDate: '2026-11-15' },
  { id: 5, guestCheckIn: '2026-11-20', guestCheckOut: '2026-11-22', proposedCleaningDate: '2026-11-22' },
  { id: 6, guestCheckIn: '2026-11-25', guestCheckOut: '2026-11-30', proposedCleaningDate: '2026-11-30' },
  { id: 7, guestCheckIn: '2026-12-23', guestCheckOut: '2026-12-26', proposedCleaningDate: '2026-12-26' },
  {
    id: 8,
    guestCheckIn: '2026-12-31',
    guestCheckOut: '2027-01-01',
    proposedCleaningDate: '2027-01-01',
    hostConfirmationRequired: true,
  },
  { id: 9, guestCheckIn: '2027-01-02', guestCheckOut: '2027-01-06', proposedCleaningDate: '2027-01-06' },
  { id: 10, guestCheckIn: '2027-01-09', guestCheckOut: '2027-01-12', proposedCleaningDate: '2027-01-12' },
  { id: 11, guestCheckIn: '2027-01-22', guestCheckOut: '2027-01-24', proposedCleaningDate: '2027-01-24' },
  { id: 12, guestCheckIn: '2027-01-28', guestCheckOut: '2027-01-31', proposedCleaningDate: '2027-01-31' },
  { id: 13, guestCheckIn: '2027-02-12', guestCheckOut: '2027-02-15', proposedCleaningDate: '2027-02-15' },
];

export function serviceDayKey(
  value: string | Date | null | undefined,
  timeZone: string = BUSINESS_ZONE
): string | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return businessDateKey(value, timeZone);
}

function sameCustomer(job: ScheduleJob, customerId: string): boolean {
  return !job.customerId || job.customerId === customerId;
}

function matchesReservation(job: ScheduleJob, reservation: ScheduleReservation, customerId: string): boolean {
  if (!sameCustomer(job, customerId)) return false;
  const checkIn = job.guestCheckIn || null;
  const checkOut = job.guestCheckOut || null;
  if (checkIn && checkOut) {
    return checkIn === reservation.guestCheckIn && checkOut === reservation.guestCheckOut;
  }
  if (checkIn && checkIn !== reservation.guestCheckIn) return false;
  if (checkOut && checkOut !== reservation.guestCheckOut) return false;
  return job.serviceDate === reservation.proposedCleaningDate;
}

function reviewReasons(job: ScheduleJob, reservation: ScheduleReservation, propertyId: string, price: string): string[] {
  const flags: string[] = [];
  if (job.propertyId !== propertyId) flags.push('property-not-linked');
  if (!job.guestCheckIn || !job.guestCheckOut) flags.push('guest-dates-not-stored');
  if (job.totalPrice != null && job.totalPrice !== price) flags.push('price-differs');
  if (TERMINAL.has(job.status)) flags.push(`terminal-status:${job.status}`);
  if (job.preferredTime) flags.push('existing-time-preserved');
  if (job.hasInvoice) flags.push('invoice-present');
  if (reservation.guestCheckOut !== reservation.proposedCleaningDate) {
    flags.push('clean-date-differs-from-checkout');
  }
  return flags;
}

function isSameDayTurn(reservations: ScheduleReservation[], reservation: ScheduleReservation): boolean {
  return reservations.some(
    (other) => other.id !== reservation.id && other.guestCheckIn === reservation.guestCheckOut
  );
}

function cleanLandsOnArrival(reservations: ScheduleReservation[], reservation: ScheduleReservation): boolean {
  return reservations.some(
    (other) => other.id !== reservation.id && other.guestCheckIn === reservation.proposedCleaningDate
  );
}

function sharesCleaningDate(reservations: ScheduleReservation[], reservation: ScheduleReservation): boolean {
  return reservations.some(
    (other) =>
      other.id !== reservation.id && other.proposedCleaningDate === reservation.proposedCleaningDate
  );
}

export function reconcileHostSchedule(input: {
  reservations: ScheduleReservation[];
  jobs: ScheduleJob[];
  customerId: string;
  propertyId: string;
  price?: string;
  source?: string;
  today?: string;
  timeZone?: string;
}): ReconciliationResult {
  const price = input.price ?? '300';
  const source = input.source ?? 'Chris schedule dated 2026-10-20';
  const timeZone = input.timeZone ?? BUSINESS_ZONE;
  const today = input.today ?? easternDateKey(new Date(), timeZone);
  const matchedIds = new Set<string>();
  const rows: ReconciliationRow[] = [];
  const proposedCreates: ProposedTurnover[] = [];

  for (const reservation of input.reservations) {
    const candidates = input.jobs.filter((job) => matchesReservation(job, reservation, input.customerId));
    const flags: string[] = [];
    if (isSameDayTurn(input.reservations, reservation)) flags.push('same-day-turnover');
    if (cleanLandsOnArrival(input.reservations, reservation)) flags.push('clean-lands-on-next-arrival');
    if (sharesCleaningDate(input.reservations, reservation)) flags.push('shared-cleaning-date');
    const nextCheckIn = input.reservations
      .map((other) => other.guestCheckIn)
      .filter((day) => day > reservation.guestCheckOut)
      .sort()[0];
    if (nextCheckIn && nextCheckIn === addCalendarDayKey(reservation.guestCheckOut, 1)) {
      flags.push('one-night-gap-before-next-stay');
    }
    if (addCalendarDayKey(today, 7) > reservation.proposedCleaningDate) {
      flags.push('inside-seven-day-access-notice');
    }

    let classification: ReconciliationClassification;
    if (candidates.length > 1) {
      classification = 'DUPLICATE — INVESTIGATE';
    } else if (reservation.hostConfirmationRequired) {
      classification = 'HOST CONFIRMATION REQUIRED';
    } else if (
      flags.includes('same-day-turnover') ||
      flags.includes('shared-cleaning-date') ||
      flags.includes('clean-lands-on-next-arrival')
    ) {
      classification = 'CONFLICT — HOLD';
    } else if (candidates.length === 1) {
      flags.push(...reviewReasons(candidates[0], reservation, input.propertyId, price));
      classification = flags.some((flag) =>
        ['property-not-linked', 'guest-dates-not-stored', 'price-differs', 'invoice-present'].includes(flag) ||
        flag.startsWith('terminal-status:')
      )
        ? 'EXISTING — NEEDS REVIEW'
        : 'EXISTING — MATCHED';
    } else {
      classification = 'MISSING — PROPOSE CREATE';
    }

    for (const job of candidates) matchedIds.add(job.id);
    rows.push({
      reservationId: reservation.id,
      classification,
      jobIds: candidates.map((job) => job.id),
      flags,
    });

    if (classification === 'MISSING — PROPOSE CREATE') {
      proposedCreates.push({
        reservationId: reservation.id,
        customerId: input.customerId,
        propertyId: input.propertyId,
        serviceType: 'Vacation Rental Turnover',
        proposedServiceDate: reservation.proposedCleaningDate,
        guestCheckIn: reservation.guestCheckIn,
        guestCheckOut: reservation.guestCheckOut,
        price,
        window: NON_SAME_DAY_WINDOW,
        source,
        cleaner: null,
        billingInitiated: false,
        notifications: false,
        status: null,
        blockedReason: PLANNING_STATE_REASON,
      });
    }
  }

  return {
    rows,
    proposedCreates,
    preservedJobIds: input.jobs.map((job) => job.id).filter((id) => !matchedIds.has(id)),
    planningStateSupported: false,
    planningStateReason: PLANNING_STATE_REASON,
  };
}
