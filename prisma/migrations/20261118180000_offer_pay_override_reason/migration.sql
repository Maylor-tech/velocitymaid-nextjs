-- Stores the reason when ops sends cleaner pay other than the 65% default.
-- Nullable. Does not rewrite existing offers.

ALTER TABLE "JobOffer" ADD COLUMN "compensationOverrideReason" TEXT;
