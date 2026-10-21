/**
 * Writes HostReservation rows and history events only.
 * No job creation, invoice, Stripe charge, cleaner offer, calendar event,
 * customer notification, completion report, or rebooking reminder.
 */
import { utcMidnightFromDateKey, type ReservationWrite } from '@/lib/scheduling/hostReservationImport';

export type ReservationWriter = {
  $transaction<T>(fn: (tx: ReservationTx) => Promise<T>): Promise<T>;
};

type ReservationTx = {
  hostReservation: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<{ id: string }>;
  };
  hostReservationEvent: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  };
};

export async function applyReservationWrites(
  db: ReservationWriter,
  writes: ReservationWrite[]
): Promise<{ created: number; updated: number }> {
  if (writes.length === 0) return { created: 0, updated: 0 };
  return db.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    for (const write of writes) {
      const data = {
        customerId: write.customerId,
        propertyId: write.propertyId,
        guestCheckInDate: utcMidnightFromDateKey(write.guestCheckIn),
        guestCheckOutDate: utcMidnightFromDateKey(write.guestCheckOut),
        bookingSource: write.bookingSource,
        proposedCleaningDate: utcMidnightFromDateKey(write.proposedCleaningDate),
        proposedCleaningWindow: write.proposedCleaningWindow,
        status: write.status,
        jobId: write.jobId,
        sourceDocumentRef: write.sourceDocumentRef,
        sourceLineKey: write.sourceLineKey,
      };
      const saved =
        write.action === 'create'
          ? await tx.hostReservation.create({ data })
          : await tx.hostReservation.update({ where: { id: write.reservationId! }, data });
      if (write.action === 'create') created += 1;
      else updated += 1;
      await tx.hostReservationEvent.create({
        data: {
          reservationId: saved.id,
          action: write.eventAction,
          before: write.before,
          after: {
            guestCheckIn: write.guestCheckIn,
            guestCheckOut: write.guestCheckOut,
            proposedCleaningDate: write.proposedCleaningDate,
            proposedCleaningWindow: write.proposedCleaningWindow,
            status: write.status,
            jobId: write.jobId,
            sourceDocumentRef: write.sourceDocumentRef,
            sourceLineKey: write.sourceLineKey,
          },
        },
      });
    }
    return { created, updated };
  });
}
