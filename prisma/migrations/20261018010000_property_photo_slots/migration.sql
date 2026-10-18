-- Property photo slots, cleaner arrival check, and CleanPhoto.slotKey.
-- Additive only. Do not apply until approved.

CREATE TYPE "ArrivalCondition" AS ENUM ('NORMAL', 'ISSUES');

ALTER TABLE "Job" ADD COLUMN "arrivalCondition" "ArrivalCondition";

ALTER TABLE "clean_photos" ADD COLUMN "slotKey" TEXT;

CREATE TABLE "property_photo_slots" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "property_photo_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_photo_slots_propertyId_key_key" ON "property_photo_slots"("propertyId", "key");

CREATE INDEX "property_photo_slots_propertyId_idx" ON "property_photo_slots"("propertyId");

CREATE INDEX "clean_photos_jobId_slotKey_idx" ON "clean_photos"("jobId", "slotKey");

ALTER TABLE "property_photo_slots" ADD CONSTRAINT "property_photo_slots_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
