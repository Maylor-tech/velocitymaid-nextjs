-- P0-D1: durable cleaner tip notification delivery markers (idempotency).
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "beneficiaryNotifiedAt" TIMESTAMP(3);
ALTER TABLE "tip_allocations" ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3);
