-- Additive history for cleaner pay. No existing payment rows are rewritten.

CREATE TYPE "PayBasis" AS ENUM ('TERMS', 'HISTORICAL_AS_PAID');
CREATE TYPE "AllocationType" AS ENUM ('JOB', 'ADVANCE', 'OTHER');
CREATE TYPE "PaidFromKind" AS ENUM ('BUSINESS_ACCOUNT', 'PERSONAL_FUNDS', 'UNKNOWN');
CREATE TYPE "W9Status" AS ENUM ('ON_FILE', 'MISSING');

ALTER TABLE "cleaner_comp_terms" ADD COLUMN "effectiveFrom" DATE;
UPDATE "cleaner_comp_terms" SET "effectiveFrom" = DATE '1970-01-01' WHERE "effectiveFrom" IS NULL;
ALTER TABLE "cleaner_comp_terms" ALTER COLUMN "effectiveFrom" SET NOT NULL;

ALTER TABLE "compensation_agreements" ADD COLUMN "manualEligibleBase" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "compensation_agreements" ADD COLUMN "payBasis" "PayBasis" NOT NULL DEFAULT 'TERMS';

ALTER TABLE "manual_payments" ADD COLUMN "paymentKey" TEXT;
ALTER TABLE "manual_payments" ADD COLUMN "paidFromKind" "PaidFromKind" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "manual_payments" ADD COLUMN "paidFromLabel" TEXT;
CREATE UNIQUE INDEX "manual_payments_paymentKey_key" ON "manual_payments"("paymentKey");

ALTER TABLE "manual_payment_allocations" ALTER COLUMN "jobId" DROP NOT NULL;
ALTER TABLE "manual_payment_allocations" ADD COLUMN "allocationType" "AllocationType" NOT NULL DEFAULT 'JOB';
ALTER TABLE "manual_payment_allocations" ADD COLUMN "memo" TEXT;
ALTER TABLE "manual_payment_allocations" ADD COLUMN "jobReference" TEXT;
ALTER TABLE "manual_payment_allocations" ADD COLUMN "payBasisNote" TEXT;
ALTER TABLE "manual_payment_allocations" ADD COLUMN "appliedJobId" TEXT;

CREATE TABLE "reimbursements_owed" (
    "id" TEXT NOT NULL,
    "manualPaymentId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reimbursements_owed_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reimbursements_owed_manualPaymentId_key" ON "reimbursements_owed"("manualPaymentId");

ALTER TABLE "reimbursements_owed" ADD CONSTRAINT "reimbursements_owed_manualPaymentId_fkey" FOREIGN KEY ("manualPaymentId") REFERENCES "manual_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "cleaner_pay_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "threshold1099" DECIMAL(10,2) NOT NULL DEFAULT 2000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaner_pay_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CleanerProfile" ADD COLUMN "w9Status" "W9Status" NOT NULL DEFAULT 'MISSING';
ALTER TABLE "CleanerProfile" ADD COLUMN "w9StatusOn" TIMESTAMP(3);

ALTER TABLE "reimbursements_owed" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cleaner_pay_settings" ENABLE ROW LEVEL SECURITY;
