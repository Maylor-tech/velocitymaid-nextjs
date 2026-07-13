-- Customer lifecycle: soft-archive + record kind (STANDARD | SYSTEM | TEST)

CREATE TYPE "CustomerRecordKind" AS ENUM ('STANDARD', 'SYSTEM', 'TEST');

ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "recordKind" "CustomerRecordKind" NOT NULL DEFAULT 'STANDARD';

CREATE INDEX IF NOT EXISTS "Customer_archivedAt_idx" ON "Customer"("archivedAt");
CREATE INDEX IF NOT EXISTS "Customer_recordKind_idx" ON "Customer"("recordKind");

-- Mark customers that share an email with an ADMIN user as SYSTEM accounts
UPDATE "Customer" AS c
SET "recordKind" = 'SYSTEM'
FROM "User" AS u
WHERE lower(u.email) = lower(c.email)
  AND u.role = 'ADMIN';

-- Business inbox often appears as a Customer with placeholder name — treat as SYSTEM
UPDATE "Customer"
SET "recordKind" = 'SYSTEM'
WHERE lower(email) = 'hello@velocitymaid.com'
  AND "recordKind" = 'STANDARD';
