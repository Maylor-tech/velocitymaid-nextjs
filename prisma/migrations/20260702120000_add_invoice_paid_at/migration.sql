-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Invoice_paidAt_idx" ON "Invoice"("paidAt");

-- Backfill paidAt for existing paid invoices
UPDATE "Invoice"
SET "paidAt" = "updatedAt"
WHERE "status" = 'PAID' AND "paidAt" IS NULL;

-- Backfill from latest payment when status is PAID but paidAt still null
UPDATE "Invoice" i
SET "paidAt" = p.latest_payment
FROM (
  SELECT "invoiceId", MAX("paymentDate") AS latest_payment
  FROM "InvoicePayment"
  GROUP BY "invoiceId"
) p
WHERE i.id = p."invoiceId"
  AND i."status" = 'PAID'
  AND i."paidAt" IS NULL;
