-- CreateEnum
CREATE TYPE "ReferralCreditStatus" AS ENUM ('PENDING', 'APPLIED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReferralEventStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "appliedReferralCode" TEXT;

-- CreateTable
CREATE TABLE "ReferralLink" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCredit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "referralLinkId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "ReferralCreditStatus" NOT NULL DEFAULT 'PENDING',
    "appliedToJobId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralEvent" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredCustomerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "referralLinkId" TEXT,
    "jobId" TEXT,
    "status" "ReferralEventStatus" NOT NULL DEFAULT 'PENDING',
    "referrerCreditId" TEXT,
    "referredDiscountApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLink_code_key" ON "ReferralLink"("code");

-- CreateIndex
CREATE INDEX "ReferralLink_customerId_idx" ON "ReferralLink"("customerId");

-- CreateIndex
CREATE INDEX "ReferralLink_branchId_idx" ON "ReferralLink"("branchId");

-- CreateIndex
CREATE INDEX "ReferralLink_code_idx" ON "ReferralLink"("code");

-- CreateIndex
CREATE INDEX "ReferralCredit_customerId_idx" ON "ReferralCredit"("customerId");

-- CreateIndex
CREATE INDEX "ReferralCredit_status_idx" ON "ReferralCredit"("status");

-- CreateIndex
CREATE INDEX "ReferralCredit_referralLinkId_idx" ON "ReferralCredit"("referralLinkId");

-- CreateIndex
CREATE INDEX "ReferralEvent_referrerId_idx" ON "ReferralEvent"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralEvent_referredCustomerId_idx" ON "ReferralEvent"("referredCustomerId");

-- CreateIndex
CREATE INDEX "ReferralEvent_branchId_idx" ON "ReferralEvent"("branchId");

-- CreateIndex
CREATE INDEX "ReferralEvent_status_idx" ON "ReferralEvent"("status");

-- CreateIndex
CREATE INDEX "ReferralEvent_referralLinkId_idx" ON "ReferralEvent"("referralLinkId");

-- CreateIndex
CREATE INDEX "Job_appliedReferralCode_idx" ON "Job"("appliedReferralCode");

-- AddForeignKey
ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCredit" ADD CONSTRAINT "ReferralCredit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCredit" ADD CONSTRAINT "ReferralCredit_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referredCustomerId_fkey" FOREIGN KEY ("referredCustomerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referralLinkId_fkey" FOREIGN KEY ("referralLinkId") REFERENCES "ReferralLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
