-- P0-D0 TipAllocation: child shares of a single Tip payment (team tips).
-- Additive. Does not rewrite Tip rows.

CREATE TABLE IF NOT EXISTS "tip_allocations" (
    "id" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OWED',
    "paidOutAt" TIMESTAMP(3),
    "payoutReference" TEXT,
    "payoutMethod" TEXT,
    "paidOutByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tip_allocations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tip_allocations_tipId_cleanerId_key"
  ON "tip_allocations"("tipId", "cleanerId");
CREATE INDEX IF NOT EXISTS "tip_allocations_tipId_idx" ON "tip_allocations"("tipId");
CREATE INDEX IF NOT EXISTS "tip_allocations_cleanerId_idx" ON "tip_allocations"("cleanerId");
CREATE INDEX IF NOT EXISTS "tip_allocations_status_idx" ON "tip_allocations"("status");

DO $$ BEGIN
  ALTER TABLE "tip_allocations" ADD CONSTRAINT "tip_allocations_tipId_fkey"
    FOREIGN KEY ("tipId") REFERENCES "tips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tip_allocations" ADD CONSTRAINT "tip_allocations_cleanerId_fkey"
    FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tip_allocations" ADD CONSTRAINT "tip_allocations_paidOutByAdminId_fkey"
    FOREIGN KEY ("paidOutByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
