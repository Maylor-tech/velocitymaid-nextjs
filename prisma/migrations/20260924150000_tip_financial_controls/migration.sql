-- P0-C tip financial controls: dispute/refund/reconcile fields + webhook event idempotency.
-- Additive only. Does not rewrite historical tip status values.

ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "disputeStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "disputedAt" TIMESTAMP(3);
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "disputeClosedAt" TIMESTAMP(3);
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "needsReconcile" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "reconcileReason" TEXT;

CREATE INDEX IF NOT EXISTS "tips_disputeStatus_idx" ON "tips"("disputeStatus");
CREATE INDEX IF NOT EXISTS "tips_needsReconcile_idx" ON "tips"("needsReconcile");

CREATE TABLE IF NOT EXISTS "tip_webhook_events" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "tipId" TEXT,
    "eventType" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tip_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tip_webhook_events_stripeEventId_key" ON "tip_webhook_events"("stripeEventId");
CREATE INDEX IF NOT EXISTS "tip_webhook_events_tipId_idx" ON "tip_webhook_events"("tipId");
CREATE INDEX IF NOT EXISTS "tip_webhook_events_createdAt_idx" ON "tip_webhook_events"("createdAt");

DO $$ BEGIN
  ALTER TABLE "tip_webhook_events" ADD CONSTRAINT "tip_webhook_events_tipId_fkey"
    FOREIGN KEY ("tipId") REFERENCES "tips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
