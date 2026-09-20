-- Phase 1C: opaque guest tip authorizations (hash-at-rest)

CREATE TABLE "guest_tip_authorizations" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_tip_authorizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guest_tip_authorizations_tokenHash_key" ON "guest_tip_authorizations"("tokenHash");

CREATE INDEX "guest_tip_authorizations_jobId_idx" ON "guest_tip_authorizations"("jobId");

CREATE INDEX "guest_tip_authorizations_propertyId_idx" ON "guest_tip_authorizations"("propertyId");

CREATE INDEX "guest_tip_authorizations_expiresAt_idx" ON "guest_tip_authorizations"("expiresAt");

ALTER TABLE "guest_tip_authorizations" ADD CONSTRAINT "guest_tip_authorizations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "guest_tip_authorizations" ADD CONSTRAINT "guest_tip_authorizations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
