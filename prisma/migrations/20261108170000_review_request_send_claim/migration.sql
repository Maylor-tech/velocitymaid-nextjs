-- Additive claim/outcome columns for review-request email sends.
-- Existing rows stay unsent (sendStatus null) and remain eligible.
ALTER TABLE "review_requests" ADD COLUMN "sendStatus" TEXT;
ALTER TABLE "review_requests" ADD COLUMN "providerMessageId" TEXT;
ALTER TABLE "review_requests" ADD COLUMN "sendError" TEXT;
ALTER TABLE "review_requests" ADD COLUMN "claimedAt" TIMESTAMP(3);

CREATE INDEX "review_requests_sendStatus_claimedAt_idx"
ON "review_requests"("sendStatus", "claimedAt");

-- One referral hold per job. Accepted and unknown outcomes keep this row so a
-- second worker cannot insert another claim. Delete it only after a definite
-- pre-send skip or a provider rejection. Existing REFERRAL_NUDGE_SENT rows are
-- outside this index, so historical duplicates do not block the migration.
CREATE UNIQUE INDEX "AuditLog_referral_nudge_claim_key"
ON "AuditLog" ("entityType", "entityId")
WHERE "action" = 'REFERRAL_NUDGE_CLAIM';
