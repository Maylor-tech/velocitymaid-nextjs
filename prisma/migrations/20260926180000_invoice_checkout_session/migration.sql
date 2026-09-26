-- P0-E1A: durable Stripe Checkout session tracking for service invoices.
-- Additive only. Does not mutate Jeff / VM-2026-0039 rows.

CREATE TYPE "InvoiceCheckoutSessionStatus" AS ENUM (
  'OPEN',
  'COMPLETED',
  'EXPIRED',
  'SUPERSEDED',
  'NEEDS_RECONCILIATION'
);

CREATE TABLE "invoice_checkout_sessions" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "stripeSessionId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "status" "InvoiceCheckoutSessionStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiredAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "capturedAmountCents" INTEGER,
  "reconciliationNote" TEXT,
  CONSTRAINT "invoice_checkout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoice_checkout_sessions_stripeSessionId_key"
  ON "invoice_checkout_sessions"("stripeSessionId");

CREATE INDEX "invoice_checkout_sessions_invoiceId_status_idx"
  ON "invoice_checkout_sessions"("invoiceId", "status");

CREATE INDEX "invoice_checkout_sessions_status_idx"
  ON "invoice_checkout_sessions"("status");

ALTER TABLE "invoice_checkout_sessions"
  ADD CONSTRAINT "invoice_checkout_sessions_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "InvoicePayment_stripeSessionId_idx"
  ON "InvoicePayment"("stripeSessionId");
