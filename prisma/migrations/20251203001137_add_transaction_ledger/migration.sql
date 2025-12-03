-- CreateTable
CREATE TABLE "TransactionLedger" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "transactionType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JMD',
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "cleanerId" TEXT,
    "customerId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionLedger_branchId_idx" ON "TransactionLedger"("branchId");

-- CreateIndex
CREATE INDEX "TransactionLedger_cleanerId_idx" ON "TransactionLedger"("cleanerId");

-- CreateIndex
CREATE INDEX "TransactionLedger_customerId_idx" ON "TransactionLedger"("customerId");

-- CreateIndex
CREATE INDEX "TransactionLedger_transactionType_idx" ON "TransactionLedger"("transactionType");

-- CreateIndex
CREATE INDEX "TransactionLedger_createdAt_idx" ON "TransactionLedger"("createdAt");

-- CreateIndex
CREATE INDEX "TransactionLedger_referenceId_referenceType_idx" ON "TransactionLedger"("referenceId", "referenceType");

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
