ALTER TABLE "Invoice" ADD COLUMN "remindersPaused" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "InvoiceReminderDelivery" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "contactDate" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  "errorSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvoiceReminderDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceReminderDelivery_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "InvoiceReminderDelivery_invoiceId_stage_key" ON "InvoiceReminderDelivery"("invoiceId", "stage");
CREATE UNIQUE INDEX "InvoiceReminderDelivery_recipientEmail_contactDate_key" ON "InvoiceReminderDelivery"("recipientEmail", "contactDate");
CREATE INDEX "InvoiceReminderDelivery_status_updatedAt_idx" ON "InvoiceReminderDelivery"("status", "updatedAt");
-- Server-only billing ledger. No public/anon/authenticated policies.
ALTER TABLE "InvoiceReminderDelivery" ENABLE ROW LEVEL SECURITY;
