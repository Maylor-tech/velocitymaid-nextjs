-- Cleaner Finish is Submitted for QC (AWAITING_QC), not final COMPLETED.
-- Offer pay basis is an explicit field, never inferred from customer pricing.
-- Additive only. Does not rewrite invoices, payments, or historical COMPLETED rows.

CREATE TYPE "CompensationBasis" AS ENUM ('FLAT', 'HOURLY', 'OTHER');

ALTER TABLE "JobOffer"
  ADD COLUMN "compensationBasis" "CompensationBasis" NOT NULL DEFAULT 'FLAT';

ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'AWAITING_QC';

ALTER TABLE "Job"
  ADD COLUMN "submittedForQcAt" TIMESTAMP(3);
