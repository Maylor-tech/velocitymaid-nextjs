-- Explicit no-charge waiver for INVOICE_AFTER_SERVICE completion.
-- Additive only. Does not rewrite invoices, jobs, or historical Chipman records.

CREATE TYPE "NoChargeReason" AS ENUM (
  'COMPLIMENTARY',
  'SERVICE_RECOVERY',
  'WARRANTY_RECLEAN',
  'INTERNAL_TEST',
  'OTHER'
);

ALTER TABLE "Job"
  ADD COLUMN "noChargeReason" "NoChargeReason";
