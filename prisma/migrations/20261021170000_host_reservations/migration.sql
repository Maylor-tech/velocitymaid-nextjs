-- Host reservation planning. Additive only. Does not alter Job, Invoice, or payment tables.
-- Do not apply until a separate production approval.
--
-- PostgreSQL runs this file in one transaction. A failure rolls the whole migration back.
--
-- Recovery before any reservation rows exist: revert the app deploy. The new tables
-- are unused by existing job, invoice, payment, and dispatch code.
-- Recovery after reservation rows exist: do not drop these tables. Revert the app
-- deploy and leave the rows in place for a forward fix.

CREATE TYPE "HostReservationStatus" AS ENUM (
  'UNCONFIRMED',
  'HOST_CONFIRMATION_REQUIRED',
  'CONFIRMED',
  'HELD',
  'CANCELLED'
);

CREATE TABLE "host_reservations" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "guestCheckInDate" TIMESTAMP(3) NOT NULL,
  "guestCheckOutDate" TIMESTAMP(3) NOT NULL,
  "bookingSource" TEXT,
  "proposedCleaningDate" TIMESTAMP(3),
  "proposedCleaningWindow" TEXT,
  "status" "HostReservationStatus" NOT NULL DEFAULT 'UNCONFIRMED',
  "jobId" TEXT,
  "sourceDocumentRef" TEXT,
  "sourceLineKey" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "host_reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "host_reservation_events" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "host_reservation_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "host_reservations_stay_key"
  ON "host_reservations"("propertyId", "guestCheckInDate", "guestCheckOutDate");

CREATE UNIQUE INDEX "host_reservations_jobId_key" ON "host_reservations"("jobId");

CREATE INDEX "host_reservations_customerId_idx" ON "host_reservations"("customerId");

CREATE INDEX "host_reservations_propertyId_proposedCleaningDate_idx"
  ON "host_reservations"("propertyId", "proposedCleaningDate");

CREATE INDEX "host_reservations_status_idx" ON "host_reservations"("status");

CREATE UNIQUE INDEX "host_reservations_source_line_key"
  ON "host_reservations"("propertyId", "sourceDocumentRef", "sourceLineKey");

CREATE INDEX "host_reservation_events_reservationId_idx"
  ON "host_reservation_events"("reservationId");

ALTER TABLE "host_reservations"
  ADD CONSTRAINT "host_reservations_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "host_reservations"
  ADD CONSTRAINT "host_reservations_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "host_reservations"
  ADD CONSTRAINT "host_reservations_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "host_reservation_events"
  ADD CONSTRAINT "host_reservation_events_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "host_reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
