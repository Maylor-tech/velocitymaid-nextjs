-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CustomerJobChangeRequest" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "CustomerJobChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerJobChangeRequest_jobId_idx" ON "CustomerJobChangeRequest"("jobId");

-- CreateIndex
CREATE INDEX "CustomerJobChangeRequest_customerId_idx" ON "CustomerJobChangeRequest"("customerId");

-- CreateIndex
CREATE INDEX "CustomerJobChangeRequest_status_idx" ON "CustomerJobChangeRequest"("status");

-- CreateIndex
CREATE INDEX "CustomerJobChangeRequest_requestedAt_idx" ON "CustomerJobChangeRequest"("requestedAt");

-- RenameForeignKey
ALTER TABLE "TrainingCertificate" RENAME CONSTRAINT "TrainingCertificate_cleanerId_TrainingStatus_fkey" TO "TrainingCertificate_trainingstatus_fkey";

-- RenameForeignKey
ALTER TABLE "TrainingCertificate" RENAME CONSTRAINT "TrainingCertificate_cleanerId_User_fkey" TO "TrainingCertificate_cleaner_fkey";

-- AddForeignKey
ALTER TABLE "CustomerJobChangeRequest" ADD CONSTRAINT "CustomerJobChangeRequest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerJobChangeRequest" ADD CONSTRAINT "CustomerJobChangeRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
