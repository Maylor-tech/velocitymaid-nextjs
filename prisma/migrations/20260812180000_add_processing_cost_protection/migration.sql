-- Additive only: processing cost protection fields.
-- Defaults OFF. Does not rewrite historical Job totals.

ALTER TABLE "Job" ADD COLUMN "operationalTotal" DECIMAL(10,2),
ADD COLUMN "processingAllowanceEstimated" DECIMAL(10,2),
ADD COLUMN "pricingPolicyVersion" TEXT;

ALTER TABLE "admin_platform_settings" ADD COLUMN "processingProtectionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "processingPercentageRate" DECIMAL(8,6),
ADD COLUMN "processingFixedFee" DECIMAL(10,2),
ADD COLUMN "processingRoundingIncrement" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "processingPolicyVersion" TEXT;
