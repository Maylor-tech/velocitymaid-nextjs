-- Job snapshots of the service agreement at booking.
-- Additive only. Do not apply until approved.
-- Existing Job, Invoice, InvoicePayment, and JobPayout rows are not updated.

ALTER TABLE "Job" ADD COLUMN "servicePackageId" TEXT,
ADD COLUMN "serviceRateId" TEXT,
ADD COLUMN "agreedCustomerPrice" DECIMAL(10,2),
ADD COLUMN "agreedOperationalPrice" DECIMAL(10,2),
ADD COLUMN "includedScopeSnapshot" TEXT,
ADD COLUMN "exclusionsSnapshot" TEXT,
ADD COLUMN "paymentPreferenceSnapshot" JSONB,
ADD COLUMN "priceOverridden" BOOLEAN,
ADD COLUMN "priceOverrideReason" TEXT;

ALTER TABLE "Job" ADD CONSTRAINT "Job_service_snapshot_price_check" CHECK (
    ("agreedCustomerPrice" IS NULL OR "agreedCustomerPrice" >= 0)
    AND ("agreedOperationalPrice" IS NULL OR "agreedOperationalPrice" >= 0)
);

ALTER TABLE "Job" ADD CONSTRAINT "Job_price_override_reason_check" CHECK (
    "priceOverridden" IS NOT TRUE
    OR ("priceOverrideReason" IS NOT NULL AND length(btrim("priceOverrideReason")) > 0)
);
