-- CreateTable
CREATE TABLE "review_requests" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_requests_jobId_idx" ON "review_requests"("jobId");

-- CreateIndex
CREATE INDEX "review_requests_scheduledFor_idx" ON "review_requests"("scheduledFor");

-- CreateIndex
CREATE INDEX "review_requests_sentAt_idx" ON "review_requests"("sentAt");
