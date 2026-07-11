-- AlterTable
ALTER TABLE "Job" ADD COLUMN "jobReference" TEXT,
ADD COLUMN "driveFolderId" TEXT,
ADD COLUMN "driveFolderUrl" TEXT,
ADD COLUMN "calendarEventId" TEXT,
ADD COLUMN "calendarEventStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobReference_key" ON "Job"("jobReference");

-- AlterTable
ALTER TABLE "admin_platform_settings" ADD COLUMN "googleDriveConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "googleCalendarConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "googleDriveRootFolderId" TEXT,
ADD COLUMN "googleCalendarId" TEXT,
ADD COLUMN "lastSyncError" TEXT,
ADD COLUMN "lastSyncErrorAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "IntegrationEventLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "channel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipient" TEXT,
    "templateKey" TEXT,
    "triggeredBy" TEXT NOT NULL,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationEventLog_jobId_idx" ON "IntegrationEventLog"("jobId");

-- CreateIndex
CREATE INDEX "IntegrationEventLog_channel_idx" ON "IntegrationEventLog"("channel");

-- CreateIndex
CREATE INDEX "IntegrationEventLog_status_idx" ON "IntegrationEventLog"("status");

-- CreateIndex
CREATE INDEX "IntegrationEventLog_createdAt_idx" ON "IntegrationEventLog"("createdAt");

-- AddForeignKey
ALTER TABLE "IntegrationEventLog" ADD CONSTRAINT "IntegrationEventLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "jobId" TEXT,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNotification_status_idx" ON "AdminNotification"("status");

-- CreateIndex
CREATE INDEX "AdminNotification_severity_idx" ON "AdminNotification"("severity");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
