-- Additive claim/outcome columns for review-request email sends.
-- Existing rows stay unsent (sendStatus null) and remain eligible.
ALTER TABLE "review_requests" ADD COLUMN "sendStatus" TEXT;
ALTER TABLE "review_requests" ADD COLUMN "providerMessageId" TEXT;
ALTER TABLE "review_requests" ADD COLUMN "sendError" TEXT;
ALTER TABLE "review_requests" ADD COLUMN "claimedAt" TIMESTAMP(3);

CREATE INDEX "review_requests_sendStatus_claimedAt_idx"
ON "review_requests"("sendStatus", "claimedAt");

-- One in-flight referral nudge claim per job. Released on provider skip/failure.
CREATE UNIQUE INDEX "AuditLog_referral_nudge_claim_key"
ON "AuditLog" ("entityType", "entityId")
WHERE "action" = 'REFERRAL_NUDGE_CLAIM';
