-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PayoutBatchStatus" AS ENUM ('DRAFT', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutTransferStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "CleanerBalanceLedger" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "branchId" TEXT,
    "jobId" TEXT,
    "payoutTransferId" TEXT,
    "type" "LedgerEntryType" NOT NULL,
    "status" "LedgerEntryStatus" NOT NULL DEFAULT 'POSTED',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerBalanceLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutBatch" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayoutBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutTransfer" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "branchId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripePayoutId" TEXT,
    "status" "PayoutTransferStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_credit_per_job" ON "CleanerBalanceLedger"("jobId", "type");

-- CreateIndex
CREATE INDEX "CleanerBalanceLedger_cleanerId_createdAt_idx" ON "CleanerBalanceLedger"("cleanerId", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutBatch_periodStart_periodEnd_idx" ON "PayoutBatch"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PayoutTransfer_cleanerId_status_idx" ON "PayoutTransfer"("cleanerId", "status");

-- AddForeignKey
ALTER TABLE "CleanerBalanceLedger" ADD CONSTRAINT "CleanerBalanceLedger_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerBalanceLedger" ADD CONSTRAINT "CleanerBalanceLedger_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerBalanceLedger" ADD CONSTRAINT "CleanerBalanceLedger_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerBalanceLedger" ADD CONSTRAINT "CleanerBalanceLedger_payoutTransferId_fkey" FOREIGN KEY ("payoutTransferId") REFERENCES "PayoutTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PayoutBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;


