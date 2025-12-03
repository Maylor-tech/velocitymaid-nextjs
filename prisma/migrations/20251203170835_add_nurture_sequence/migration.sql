-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ACTIVE', 'BOOKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NurtureChannel" AS ENUM ('WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "NurtureMessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'STOPPED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "leadStatus" "LeadStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NurtureSequence" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentDay" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurtureSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurtureHistory" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "nurtureSequenceId" TEXT,
    "day" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NurtureChannel" NOT NULL,
    "status" "NurtureMessageStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NurtureHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NurtureSequence_customerId_key" ON "NurtureSequence"("customerId");

-- CreateIndex
CREATE INDEX "NurtureSequence_customerId_idx" ON "NurtureSequence"("customerId");

-- CreateIndex
CREATE INDEX "NurtureSequence_branchId_idx" ON "NurtureSequence"("branchId");

-- CreateIndex
CREATE INDEX "NurtureSequence_isActive_idx" ON "NurtureSequence"("isActive");

-- CreateIndex
CREATE INDEX "NurtureHistory_customerId_idx" ON "NurtureHistory"("customerId");

-- CreateIndex
CREATE INDEX "NurtureHistory_nurtureSequenceId_idx" ON "NurtureHistory"("nurtureSequenceId");

-- CreateIndex
CREATE INDEX "NurtureHistory_day_idx" ON "NurtureHistory"("day");

-- CreateIndex
CREATE INDEX "NurtureHistory_status_idx" ON "NurtureHistory"("status");

-- CreateIndex
CREATE INDEX "Customer_leadStatus_idx" ON "Customer"("leadStatus");

-- AddForeignKey
ALTER TABLE "NurtureSequence" ADD CONSTRAINT "NurtureSequence_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurtureSequence" ADD CONSTRAINT "NurtureSequence_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurtureHistory" ADD CONSTRAINT "NurtureHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurtureHistory" ADD CONSTRAINT "NurtureHistory_nurtureSequenceId_fkey" FOREIGN KEY ("nurtureSequenceId") REFERENCES "NurtureSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
