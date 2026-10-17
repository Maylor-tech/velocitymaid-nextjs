-- FIN-001: concurrency-safe invoice payment + payout ledger uniqueness.
-- Additive only. Does NOT delete or repair existing rows.
-- Before applying on staging/prod, run a readonly duplicate probe:
--   SELECT "stripeSessionId", COUNT(*) FROM "InvoicePayment"
--     WHERE "stripeSessionId" IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
--   SELECT "transactionReference", COUNT(*) FROM "InvoicePayment"
--     WHERE "transactionReference" IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
--   SELECT "referenceId", "referenceType", COUNT(*) FROM "TransactionLedger"
--     WHERE "referenceId" IS NOT NULL AND "referenceType" IS NOT NULL
--     GROUP BY 1, 2 HAVING COUNT(*) > 1;
-- Migration fails closed if duplicates exist (unique index create errors).

-- One Stripe Checkout session credits at most one InvoicePayment.
CREATE UNIQUE INDEX IF NOT EXISTS "InvoicePayment_stripeSessionId_unique"
  ON "InvoicePayment" ("stripeSessionId")
  WHERE "stripeSessionId" IS NOT NULL;

-- One external reference (PI / Zelle memo / bank ref) credits at most once globally.
CREATE UNIQUE INDEX IF NOT EXISTS "InvoicePayment_transactionReference_global_unique"
  ON "InvoicePayment" ("transactionReference")
  WHERE "transactionReference" IS NOT NULL;

-- One TransactionLedger row per JobPayout (and any other soft reference pair).
CREATE UNIQUE INDEX IF NOT EXISTS "TransactionLedger_referenceId_referenceType_unique"
  ON "TransactionLedger" ("referenceId", "referenceType")
  WHERE "referenceId" IS NOT NULL AND "referenceType" IS NOT NULL;
