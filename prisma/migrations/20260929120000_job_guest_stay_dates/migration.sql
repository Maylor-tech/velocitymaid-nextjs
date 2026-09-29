-- Gate 2: structured guest stay dates on Job.
-- preferredDate remains the VelocityMaid turnover/service date.
-- Additive only — nullable columns, no backfill, no production row mutations.

ALTER TABLE "Job"
  ADD COLUMN IF NOT EXISTS "guestCheckInDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "guestCheckOutDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Job_guestCheckInDate_idx" ON "Job"("guestCheckInDate");
CREATE INDEX IF NOT EXISTS "Job_guestCheckOutDate_idx" ON "Job"("guestCheckOutDate");
