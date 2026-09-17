-- Phase 7D-2: Worker record foundation (additive).
-- Does NOT invent classification, agreements, addresses, or tax IDs for existing cleaners.
-- classificationStatus defaults to UNRESOLVED for new columns / existing rows.

ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "legalFirstName" TEXT;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "legalLastName" TEXT;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "mailingAddressLine1" TEXT;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "mailingAddressLine2" TEXT;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "mailingCity" TEXT;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "mailingState" TEXT;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "mailingPostalCode" TEXT;
-- mailingCountry stays NULL for existing rows (do not invent "US" via column DEFAULT fill).
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "mailingCountry" TEXT;
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "inactiveDate" TIMESTAMP(3);
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "classificationStatus" TEXT NOT NULL DEFAULT 'UNRESOLVED';
ALTER TABLE "CleanerProfile" ADD COLUMN IF NOT EXISTS "paymentPreference" TEXT;

CREATE INDEX IF NOT EXISTS "CleanerProfile_classificationStatus_idx" ON "CleanerProfile"("classificationStatus");

-- Ensure existing rows that somehow lack the column default stay UNRESOLVED
UPDATE "CleanerProfile"
SET "classificationStatus" = 'UNRESOLVED'
WHERE "classificationStatus" IS NULL OR "classificationStatus" = '';

CREATE TABLE IF NOT EXISTS "WorkerAgreement" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "agreementType" TEXT NOT NULL,
    "agreementVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "documentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkerAgreement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkerAgreement_cleanerId_idx" ON "WorkerAgreement"("cleanerId");
CREATE INDEX IF NOT EXISTS "WorkerAgreement_status_idx" ON "WorkerAgreement"("status");
CREATE INDEX IF NOT EXISTS "WorkerAgreement_agreementType_idx" ON "WorkerAgreement"("agreementType");

DO $$ BEGIN
  ALTER TABLE "WorkerAgreement" ADD CONSTRAINT "WorkerAgreement_cleanerId_fkey"
    FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "WorkerDocument" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    "receivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "externalProviderReference" TEXT,
    "documentReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkerDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkerDocument_cleanerId_idx" ON "WorkerDocument"("cleanerId");
CREATE INDEX IF NOT EXISTS "WorkerDocument_documentType_idx" ON "WorkerDocument"("documentType");
CREATE INDEX IF NOT EXISTS "WorkerDocument_status_idx" ON "WorkerDocument"("status");

DO $$ BEGIN
  ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_cleanerId_fkey"
    FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
