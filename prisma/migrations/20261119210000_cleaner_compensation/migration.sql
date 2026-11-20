-- Additive cleaner compensation ledger.
-- New types and tables only. Does not alter existing tables or rewrite existing rows.
-- Row level security is enabled with no policies: the app role used by Prisma bypasses it;
-- the public anon role cannot read pay rows.

CREATE TYPE "CompensationMethod" AS ENUM ('PERCENTAGE', 'HOURLY', 'FLAT');

CREATE TYPE "ManualPaymentMethod" AS ENUM ('ZELLE', 'CASH', 'CHECK', 'OTHER');

CREATE TYPE "CleanerPayableStatus" AS ENUM ('NEEDS_HOURS', 'NEEDS_RECONCILIATION', 'PAID_MANUALLY', 'OWED', 'OVERPAID');

CREATE TABLE "cleaner_comp_terms" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "soloMethod" "CompensationMethod" NOT NULL,
    "soloRate" DECIMAL(10,2) NOT NULL,
    "assistedMethod" "CompensationMethod" NOT NULL,
    "assistedRate" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "setBy" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaner_comp_terms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cleaner_comp_terms_cleanerId_key" ON "cleaner_comp_terms"("cleanerId");

CREATE TABLE "compensation_agreements" (
    "id" TEXT NOT NULL,
    "jobOfferId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "method" "CompensationMethod" NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "eligibleBase" DECIMAL(10,2),
    "includedAddOns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "assisted" BOOLEAN NOT NULL DEFAULT false,
    "setBy" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "frozenAt" TIMESTAMP(3),
    "verifiedHours" DECIMAL(8,2),
    "hoursVerifiedBy" TEXT,
    "hoursVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "compensation_agreements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compensation_agreements_jobOfferId_key" ON "compensation_agreements"("jobOfferId");
CREATE INDEX "compensation_agreements_jobId_cleanerId_idx" ON "compensation_agreements"("jobId", "cleanerId");
CREATE INDEX "compensation_agreements_cleanerId_idx" ON "compensation_agreements"("cleanerId");

CREATE TABLE "manual_payments" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "paidOn" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "ManualPaymentMethod" NOT NULL,
    "memo" TEXT,
    "recordedBy" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manual_payments_cleanerId_paidOn_idx" ON "manual_payments"("cleanerId", "paidOn");

CREATE TABLE "manual_payment_allocations" (
    "id" TEXT NOT NULL,
    "manualPaymentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "manual_payment_allocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manual_payment_allocations_jobId_idx" ON "manual_payment_allocations"("jobId");
CREATE INDEX "manual_payment_allocations_manualPaymentId_idx" ON "manual_payment_allocations"("manualPaymentId");

CREATE TABLE "cleaner_payables" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "expected" DECIMAL(10,2) NOT NULL,
    "paid" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "status" "CleanerPayableStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaner_payables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cleaner_payables_jobId_cleanerId_key" ON "cleaner_payables"("jobId", "cleanerId");
CREATE INDEX "cleaner_payables_cleanerId_status_idx" ON "cleaner_payables"("cleanerId", "status");

ALTER TABLE "cleaner_comp_terms" ADD CONSTRAINT "cleaner_comp_terms_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "compensation_agreements" ADD CONSTRAINT "compensation_agreements_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compensation_agreements" ADD CONSTRAINT "compensation_agreements_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compensation_agreements" ADD CONSTRAINT "compensation_agreements_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manual_payments" ADD CONSTRAINT "manual_payments_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manual_payment_allocations" ADD CONSTRAINT "manual_payment_allocations_manualPaymentId_fkey" FOREIGN KEY ("manualPaymentId") REFERENCES "manual_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manual_payment_allocations" ADD CONSTRAINT "manual_payment_allocations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cleaner_payables" ADD CONSTRAINT "cleaner_payables_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cleaner_payables" ADD CONSTRAINT "cleaner_payables_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cleaner_comp_terms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compensation_agreements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "manual_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "manual_payment_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cleaner_payables" ENABLE ROW LEVEL SECURITY;
