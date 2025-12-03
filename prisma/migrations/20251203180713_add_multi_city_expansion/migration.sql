-- AlterTable
ALTER TABLE "BranchLandingContent" ADD COLUMN     "cityContent" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "homeZip" TEXT,
ADD COLUMN     "preferredCities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "User_preferredCities_idx" ON "User"("preferredCities");
