-- Cleaner compensation ledger. One migration. Not applied on production.
-- Row level security is enabled with no policies: Prisma bypasses it; anon cannot read pay rows.

CREATE TYPE "CompensationMethod" AS ENUM ('PERCENTAGE', 'HOURLY', 'FLAT');
CREATE TYPE "ManualPaymentMethod" AS ENUM ('ZELLE', 'CASH', 'CHECK', 'OTHER');
CREATE TYPE "CleanerPayableStatus" AS ENUM ('NEEDS_HOURS', 'NEEDS_RECONCILIATION', 'PAID_MANUALLY', 'OWED', 'OVERPAID');
CREATE TYPE "PayBasis" AS ENUM ('TERMS', 'HISTORICAL_AS_PAID');
CREATE TYPE "AllocationType" AS ENUM ('JOB', 'ADVANCE', 'OTHER');
CREATE TYPE "PaidFromKind" AS ENUM ('BUSINESS_ACCOUNT', 'PERSONAL_FUNDS', 'UNKNOWN');
CREATE TYPE "ReimbursementStatus" AS ENUM ('OWED', 'REPAID');
CREATE TYPE "TaxPaperworkType" AS ENUM ('W9', 'W4_I9', 'NONE');
CREATE TYPE "TaxPaperworkStatus" AS ENUM ('ON_FILE', 'MISSING');

CREATE TABLE "cleaner_comp_terms" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "soloMethod" "CompensationMethod" NOT NULL,
    "soloRate" DECIMAL(10,2) NOT NULL,
    "assistedMethod" "CompensationMethod" NOT NULL,
    "assistedRate" DECIMAL(10,2) NOT NULL,
    "homeSizeMinBedrooms" INTEGER,
    "homeSizeSoloMethod" "CompensationMethod",
    "homeSizeSoloRate" DECIMAL(10,2),
    "effectiveFrom" DATE NOT NULL,
    "note" TEXT,
    "setBy" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaner_comp_terms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cleaner_comp_terms_solo_rate_positive" CHECK ("soloRate" > 0),
    CONSTRAINT "cleaner_comp_terms_assisted_rate_positive" CHECK ("assistedRate" > 0),
    CONSTRAINT "cleaner_comp_terms_home_size_complete" CHECK (
        (
            "homeSizeMinBedrooms" IS NULL
            AND "homeSizeSoloMethod" IS NULL
            AND "homeSizeSoloRate" IS NULL
        )
        OR (
            "homeSizeMinBedrooms" IS NOT NULL
            AND "homeSizeSoloMethod" IS NOT NULL
            AND "homeSizeSoloRate" IS NOT NULL
        )
    ),
    CONSTRAINT "cleaner_comp_terms_home_size_bedrooms_positive" CHECK (
        "homeSizeMinBedrooms" IS NULL OR "homeSizeMinBedrooms" >= 1
    ),
    CONSTRAINT "cleaner_comp_terms_home_size_rate_positive" CHECK (
        "homeSizeSoloRate" IS NULL OR "homeSizeSoloRate" > 0
    )
);

CREATE UNIQUE INDEX "cleaner_comp_terms_cleanerId_effectiveFrom_key" ON "cleaner_comp_terms"("cleanerId", "effectiveFrom");
CREATE INDEX "cleaner_comp_terms_cleanerId_idx" ON "cleaner_comp_terms"("cleanerId");

CREATE TABLE "compensation_agreements" (
    "id" TEXT NOT NULL,
    "jobOfferId" TEXT,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "method" "CompensationMethod" NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "eligibleBase" DECIMAL(10,2),
    "manualEligibleBase" BOOLEAN NOT NULL DEFAULT false,
    "payBasis" "PayBasis" NOT NULL DEFAULT 'TERMS',
    "includedAddOns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "assisted" BOOLEAN NOT NULL DEFAULT false,
    "setBy" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "frozenAt" TIMESTAMP(3),
    "verifiedHours" DECIMAL(8,2),
    "hoursVerifiedBy" TEXT,
    "hoursVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "compensation_agreements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "compensation_agreements_rate_positive" CHECK ("rate" > 0),
    CONSTRAINT "compensation_agreements_hours_positive" CHECK ("verifiedHours" IS NULL OR "verifiedHours" > 0)
);

CREATE UNIQUE INDEX "compensation_agreements_jobOfferId_key" ON "compensation_agreements"("jobOfferId");
CREATE UNIQUE INDEX "compensation_agreements_jobId_cleanerId_key" ON "compensation_agreements"("jobId", "cleanerId");
CREATE INDEX "compensation_agreements_cleanerId_idx" ON "compensation_agreements"("cleanerId");

CREATE TABLE "manual_payments" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "paymentKey" TEXT,
    "paidOn" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "ManualPaymentMethod" NOT NULL,
    "paidFromKind" "PaidFromKind" NOT NULL DEFAULT 'UNKNOWN',
    "paidFromLabel" TEXT,
    "memo" TEXT,
    "recordedBy" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "manual_payments_amount_positive" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "manual_payments_paymentKey_key" ON "manual_payments"("paymentKey");
CREATE INDEX "manual_payments_cleanerId_paidOn_idx" ON "manual_payments"("cleanerId", "paidOn");

CREATE TABLE "manual_payment_allocations" (
    "id" TEXT NOT NULL,
    "manualPaymentId" TEXT NOT NULL,
    "jobId" TEXT,
    "allocationType" "AllocationType" NOT NULL DEFAULT 'JOB',
    "amount" DECIMAL(10,2) NOT NULL,
    "memo" TEXT,
    "jobReference" TEXT,
    "payBasisNote" TEXT,
    "appliedJobId" TEXT,

    CONSTRAINT "manual_payment_allocations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "manual_payment_allocations_amount_positive" CHECK ("amount" > 0)
);

CREATE INDEX "manual_payment_allocations_jobId_idx" ON "manual_payment_allocations"("jobId");
CREATE INDEX "manual_payment_allocations_manualPaymentId_idx" ON "manual_payment_allocations"("manualPaymentId");

CREATE TABLE "reimbursements_owed" (
    "id" TEXT NOT NULL,
    "manualPaymentId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'OWED',
    "repaidOn" DATE,
    "repaidMethod" "ManualPaymentMethod",
    "repaidMemo" TEXT,
    "repaidBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reimbursements_owed_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reimbursements_owed_repaid_complete" CHECK (
        ("status" = 'OWED' AND "repaidOn" IS NULL)
        OR ("status" = 'REPAID' AND "repaidOn" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "reimbursements_owed_manualPaymentId_key" ON "reimbursements_owed"("manualPaymentId");

CREATE TABLE "cleaner_pay_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "threshold1099" DECIMAL(10,2) NOT NULL DEFAULT 2000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaner_pay_settings_pkey" PRIMARY KEY ("id")
);

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

ALTER TABLE "CleanerProfile" ADD COLUMN "taxPaperworkType" "TaxPaperworkType" NOT NULL DEFAULT 'W9';
ALTER TABLE "CleanerProfile" ADD COLUMN "taxPaperworkStatus" "TaxPaperworkStatus" NOT NULL DEFAULT 'MISSING';
ALTER TABLE "CleanerProfile" ADD COLUMN "taxPaperworkOn" TIMESTAMP(3);

ALTER TABLE "cleaner_comp_terms" ADD CONSTRAINT "cleaner_comp_terms_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "compensation_agreements" ADD CONSTRAINT "compensation_agreements_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compensation_agreements" ADD CONSTRAINT "compensation_agreements_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compensation_agreements" ADD CONSTRAINT "compensation_agreements_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manual_payments" ADD CONSTRAINT "manual_payments_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manual_payment_allocations" ADD CONSTRAINT "manual_payment_allocations_manualPaymentId_fkey" FOREIGN KEY ("manualPaymentId") REFERENCES "manual_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manual_payment_allocations" ADD CONSTRAINT "manual_payment_allocations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manual_payment_allocations" ADD CONSTRAINT "manual_payment_allocations_appliedJobId_fkey" FOREIGN KEY ("appliedJobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reimbursements_owed" ADD CONSTRAINT "reimbursements_owed_manualPaymentId_fkey" FOREIGN KEY ("manualPaymentId") REFERENCES "manual_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cleaner_payables" ADD CONSTRAINT "cleaner_payables_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cleaner_payables" ADD CONSTRAINT "cleaner_payables_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cleaner_comp_terms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compensation_agreements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "manual_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "manual_payment_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reimbursements_owed" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cleaner_pay_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cleaner_payables" ENABLE ROW LEVEL SECURITY;
