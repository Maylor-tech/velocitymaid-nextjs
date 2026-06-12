-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'DEPOSIT_PAID', 'BALANCE_DUE', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "quotedTotal" DECIMAL(10,2),
ADD COLUMN "depositAmount" DECIMAL(10,2),
ADD COLUMN "amountPaid" DECIMAL(10,2),
ADD COLUMN "balanceDue" DECIMAL(10,2),
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewStatus" "JobReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "depositPaymentIntentId" TEXT,
ADD COLUMN "balanceSessionId" TEXT,
ADD COLUMN "balancePaymentIntentId" TEXT,
ADD COLUMN "depositPaidAt" TIMESTAMP(3),
ADD COLUMN "balancePaidAt" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Job_balanceSessionId_key" ON "Job"("balanceSessionId");

-- CreateIndex
CREATE INDEX "Job_paymentStatus_idx" ON "Job"("paymentStatus");

-- CreateIndex
CREATE INDEX "Job_reviewStatus_idx" ON "Job"("reviewStatus");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing jobs with payment data (legacy full-pay bookings)
UPDATE "Job"
SET
  "quotedTotal" = "totalPrice",
  "amountPaid" = "totalPrice",
  "balanceDue" = 0,
  "paymentStatus" = 'PAID',
  "reviewStatus" = 'APPROVED'
WHERE "totalPrice" IS NOT NULL AND "totalPrice" > 0;

UPDATE "Job"
SET
  "paymentStatus" = 'PAID',
  "reviewStatus" = 'APPROVED'
WHERE "sessionId" IS NOT NULL
  AND "paymentStatus" = 'PENDING';
