-- Phase 1 Cleaner Dispatch: JobOffer + Job dispatch columns + CleanPhoto category.
-- Additive only. Does not rewrite invoices, payments, or historical Chipman rows.

CREATE TYPE "DispatchUrgency" AS ENUM ('STANDARD', 'SAME_DAY', 'URGENT');
CREATE TYPE "JobOfferStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "CleanPhotoCategory" AS ENUM ('BEFORE', 'AFTER', 'ISSUE', 'DAMAGE', 'SUPPLY', 'OTHER');

ALTER TABLE "Job"
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "estimatedDurationMins" INTEGER,
  ADD COLUMN "dispatchUrgency" "DispatchUrgency" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "clean_photos"
  ADD COLUMN "category" "CleanPhotoCategory" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "customerVisible" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "status" "JobOfferStatus" NOT NULL DEFAULT 'OFFERED',
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "compensationAmount" DECIMAL(10,2) NOT NULL,
    "compensationCurrency" TEXT NOT NULL DEFAULT 'USD',
    "estimatedDurationMins" INTEGER,
    "operationalNotes" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "createdByAdminId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Job_dispatchUrgency_idx" ON "Job"("dispatchUrgency");
CREATE INDEX "clean_photos_jobId_category_idx" ON "clean_photos"("jobId", "category");
CREATE INDEX "JobOffer_jobId_status_idx" ON "JobOffer"("jobId", "status");
CREATE INDEX "JobOffer_cleanerId_status_idx" ON "JobOffer"("cleanerId", "status");
CREATE INDEX "JobOffer_expiresAt_idx" ON "JobOffer"("expiresAt");
CREATE INDEX "JobOffer_expiresAt_offered_idx" ON "JobOffer"("expiresAt") WHERE "status" = 'OFFERED';

-- Vermont Phase 1: one outstanding offer and one accepted offer per job.
CREATE UNIQUE INDEX "JobOffer_one_offered_per_job" ON "JobOffer"("jobId") WHERE "status" = 'OFFERED';
CREATE UNIQUE INDEX "JobOffer_one_accepted_per_job" ON "JobOffer"("jobId") WHERE "status" = 'ACCEPTED';

ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_cancelledByAdminId_fkey" FOREIGN KEY ("cancelledByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing photos stay operational evidence, never customer-visible by default.
UPDATE "clean_photos" SET "customerVisible" = false WHERE "customerVisible" IS DISTINCT FROM false;
UPDATE "clean_photos" SET "category" = 'OTHER' WHERE "category" IS NULL;
UPDATE "Job" SET "dispatchUrgency" = 'STANDARD' WHERE "dispatchUrgency" IS NULL;

ALTER TABLE "JobOffer" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    EXECUTE 'DROP POLICY "allow_postgres_full_access" ON public."JobOffer"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  EXECUTE 'CREATE POLICY "allow_postgres_full_access" ON public."JobOffer" FOR ALL TO postgres USING (true) WITH CHECK (true)';

  BEGIN
    EXECUTE 'DROP POLICY "allow_service_role_full_access" ON public."JobOffer"';
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  EXECUTE 'CREATE POLICY "allow_service_role_full_access" ON public."JobOffer" FOR ALL TO service_role USING (true) WITH CHECK (true)';
END;
$$;
