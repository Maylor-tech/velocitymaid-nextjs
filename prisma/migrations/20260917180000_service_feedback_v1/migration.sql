-- CreateEnum
CREATE TYPE "ServiceFeedbackStatus" AS ENUM ('REQUESTED', 'SUBMITTED', 'UNDER_REVIEW', 'RELEASED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ServiceFeedbackDisposition" AS ENUM ('SERVICE_QUALITY', 'CLEANER_PERFORMANCE', 'ACCESS', 'PROPERTY_CONDITION', 'SUPPLIES_LINENS', 'MAINTENANCE', 'SCHEDULING_TIMING', 'CUSTOMER_EXPECTATION', 'OTHER');

-- CreateTable
CREATE TABLE "service_feedback" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "cleanerId" TEXT,
    "propertyId" TEXT,
    "overallRating" INTEGER,
    "cleanlinessRating" INTEGER,
    "communicationRating" INTEGER,
    "timelinessRating" INTEGER,
    "comment" TEXT,
    "status" "ServiceFeedbackStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "dispositionCategory" "ServiceFeedbackDisposition",
    "adminNotes" TEXT,
    "cleanerResponse" TEXT,
    "cleanerRespondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_feedback_publicToken_key" ON "service_feedback"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "service_feedback_jobId_key" ON "service_feedback"("jobId");

-- CreateIndex
CREATE INDEX "service_feedback_status_idx" ON "service_feedback"("status");

-- CreateIndex
CREATE INDEX "service_feedback_customerId_idx" ON "service_feedback"("customerId");

-- CreateIndex
CREATE INDEX "service_feedback_cleanerId_idx" ON "service_feedback"("cleanerId");

-- CreateIndex
CREATE INDEX "service_feedback_propertyId_idx" ON "service_feedback"("propertyId");

-- CreateIndex
CREATE INDEX "service_feedback_overallRating_idx" ON "service_feedback"("overallRating");

-- CreateIndex
CREATE INDEX "service_feedback_submittedAt_idx" ON "service_feedback"("submittedAt");

-- CreateIndex
CREATE INDEX "service_feedback_requestedAt_idx" ON "service_feedback"("requestedAt");

-- CreateIndex
CREATE INDEX "service_feedback_publicToken_idx" ON "service_feedback"("publicToken");

-- AddForeignKey
ALTER TABLE "service_feedback" ADD CONSTRAINT "service_feedback_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_feedback" ADD CONSTRAINT "service_feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_feedback" ADD CONSTRAINT "service_feedback_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_feedback" ADD CONSTRAINT "service_feedback_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
