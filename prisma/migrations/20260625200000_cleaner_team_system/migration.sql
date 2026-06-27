-- CleanerProfile + JobTeamMember for internal team and multi-cleaner assignments

CREATE TABLE "CleanerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "publicDisplayName" TEXT,
    "jobTitle" TEXT,
    "serviceAreas" JSONB,
    "memberStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "certificationLabel" TEXT NOT NULL DEFAULT 'PENDING',
    "internalNotes" TEXT,
    "isInternalTeam" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobTeamMember" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CleanerProfile_userId_key" ON "CleanerProfile"("userId");
CREATE INDEX "CleanerProfile_memberStatus_idx" ON "CleanerProfile"("memberStatus");
CREATE INDEX "CleanerProfile_isInternalTeam_idx" ON "CleanerProfile"("isInternalTeam");

CREATE UNIQUE INDEX "JobTeamMember_jobId_cleanerId_key" ON "JobTeamMember"("jobId", "cleanerId");
CREATE INDEX "JobTeamMember_jobId_idx" ON "JobTeamMember"("jobId");
CREATE INDEX "JobTeamMember_cleanerId_idx" ON "JobTeamMember"("cleanerId");

ALTER TABLE "CleanerProfile" ADD CONSTRAINT "CleanerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobTeamMember" ADD CONSTRAINT "JobTeamMember_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobTeamMember" ADD CONSTRAINT "JobTeamMember_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
