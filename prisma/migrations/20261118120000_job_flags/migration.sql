-- Additive JobFlag ledger. Creates new types and job_flags only.
-- Does not alter existing tables or rewrite existing rows.

CREATE TYPE "JobFlagKind" AS ENUM ('DAMAGE', 'SUPPLY', 'ISSUE', 'ARRIVAL');

CREATE TYPE "HostNotifyChannel" AS ENUM ('EMAIL', 'TEXT', 'CALL', 'IN_REPORT');

CREATE TABLE "job_flags" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "kind" "JobFlagKind" NOT NULL,
    "note" TEXT NOT NULL,
    "photoId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hostNotifiedAt" TIMESTAMP(3),
    "hostNotifiedById" TEXT,
    "hostNotifiedChannel" "HostNotifyChannel",
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "job_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_flags_photoId_key" ON "job_flags"("photoId");

CREATE INDEX "job_flags_jobId_idx" ON "job_flags"("jobId");

CREATE INDEX "job_flags_hostNotifiedAt_resolvedAt_idx" ON "job_flags"("hostNotifiedAt", "resolvedAt");

-- One arrival-issues flag per job. Photo flags stay unique on photoId.
CREATE UNIQUE INDEX "job_flags_one_arrival_per_job" ON "job_flags"("jobId") WHERE "kind" = 'ARRIVAL';

ALTER TABLE "job_flags" ADD CONSTRAINT "job_flags_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_flags" ADD CONSTRAINT "job_flags_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "clean_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_flags" ADD CONSTRAINT "job_flags_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_flags" ADD CONSTRAINT "job_flags_hostNotifiedById_fkey" FOREIGN KEY ("hostNotifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_flags" ADD CONSTRAINT "job_flags_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
