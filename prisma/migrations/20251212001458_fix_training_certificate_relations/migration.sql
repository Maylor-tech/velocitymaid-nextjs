/*
  Warnings:

  - A unique constraint covering the columns `[trainingStatusId]` on the table `TrainingCertificate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trainingStatusId` to the `TrainingCertificate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TrainingCertificate" DROP CONSTRAINT "TrainingCertificate_trainingstatus_fkey";

-- AlterTable
ALTER TABLE "TrainingCertificate" ADD COLUMN     "trainingStatusId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_trainingStatusId_key" ON "TrainingCertificate"("trainingStatusId");

-- CreateIndex
CREATE INDEX "TrainingCertificate_trainingStatusId_idx" ON "TrainingCertificate"("trainingStatusId");

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_trainingstatus_fkey" FOREIGN KEY ("trainingStatusId") REFERENCES "TrainingStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
