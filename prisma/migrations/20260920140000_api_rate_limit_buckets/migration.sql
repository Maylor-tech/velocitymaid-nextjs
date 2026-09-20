-- Durable shared rate-limit buckets (Postgres) for serverless stay resolve

CREATE TABLE "api_rate_limit_buckets" (
    "id" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_rate_limit_buckets_bucketKey_key" ON "api_rate_limit_buckets"("bucketKey");

CREATE INDEX "api_rate_limit_buckets_resetAt_idx" ON "api_rate_limit_buckets"("resetAt");
