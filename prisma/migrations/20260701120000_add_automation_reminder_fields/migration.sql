-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "followUpSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Customer_followUpSentAt_idx" ON "Customer"("followUpSentAt");

-- CreateIndex
CREATE INDEX "Invoice_reminderSentAt_idx" ON "Invoice"("reminderSentAt");
