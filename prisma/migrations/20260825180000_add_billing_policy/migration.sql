-- PREPAY vs INVOICE_AFTER_SERVICE commercial collection model.
-- Independent of Job.status and PaymentStatus. Do not treat invoice-after as paid.

CREATE TYPE "BillingPolicy" AS ENUM ('PREPAY', 'INVOICE_AFTER_SERVICE');

ALTER TABLE "Customer" ADD COLUMN "billingPolicy" "BillingPolicy" NOT NULL DEFAULT 'PREPAY';
ALTER TABLE "properties" ADD COLUMN "billingPolicy" "BillingPolicy";
ALTER TABLE "Job" ADD COLUMN "billingPolicy" "BillingPolicy";

-- Vermont hosts with a standing Property: authorized invoice-after-service.
UPDATE "Customer" c
SET "billingPolicy" = 'INVOICE_AFTER_SERVICE'
FROM "Branch" b
WHERE c."branchId" = b.id
  AND b.slug = 'vermont'
  AND EXISTS (
    SELECT 1 FROM "properties" p WHERE p."customerId" = c.id
  );

-- Snapshot onto existing host-portal Jobs so assignment is not blocked.
UPDATE "Job" j
SET "billingPolicy" = c."billingPolicy"
FROM "Customer" c
WHERE j."customerId" = c.id
  AND c."billingPolicy" = 'INVOICE_AFTER_SERVICE'
  AND j."internalNotes" LIKE '%[Source: HOST_PORTAL]%';
