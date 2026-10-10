-- Idempotent deposit-to-invoice credit: one PaymentIntent per invoice.
-- PostgreSQL UNIQUE allows multiple NULLs, so legacy payments without a
-- transactionReference remain valid.
CREATE UNIQUE INDEX "invoice_payment_intent_once" ON "InvoicePayment"("invoiceId", "transactionReference");

CREATE INDEX IF NOT EXISTS "InvoicePayment_transactionReference_idx" ON "InvoicePayment"("transactionReference");
