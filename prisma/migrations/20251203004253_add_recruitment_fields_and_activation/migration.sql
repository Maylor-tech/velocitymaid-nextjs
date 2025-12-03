-- AlterTable
ALTER TABLE "CleanerApplication" ADD COLUMN     "applicantFitScore" INTEGER,
ADD COLUMN     "areaOfResidence" TEXT,
ADD COLUMN     "canTravelToVillas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "idUploadUrl" TEXT,
ADD COLUMN     "referencesUploadUrl" TEXT,
ADD COLUMN     "weekendAbility" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CleanerApplication_applicantFitScore_idx" ON "CleanerApplication"("applicantFitScore");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
