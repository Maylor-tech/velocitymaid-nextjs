-- Immutable start of the Resend idempotency key for a review request.
-- Nullable so existing rows stay unsent and eligible for a first claim.
-- Rows already CLAIMED or FAILED with no attempt timestamp are reconciled
-- by the application to UNKNOWN. Do not copy claimedAt into this column:
-- claimedAt moves on every reclaim.
ALTER TABLE "review_requests" ADD COLUMN "firstProviderAttemptAt" TIMESTAMP(3);

CREATE INDEX "review_requests_sendStatus_firstProviderAttemptAt_idx"
ON "review_requests"("sendStatus", "firstProviderAttemptAt");
