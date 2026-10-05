-- CreateEnum
CREATE TYPE "PropertyUseType" AS ENUM ('HOST', 'RESIDENTIAL');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "useType" "PropertyUseType";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "estimatedLaborHours" DECIMAL(6,2),
ADD COLUMN "actualLaborHours" DECIMAL(6,2),
ADD COLUMN "pricingBasis" TEXT;

-- CreateTable
CREATE TABLE "property_residential_profiles" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "serviceType" TEXT,
    "frequency" TEXT,
    "preferredServiceDate" TEXT,
    "preferredContactMethod" TEXT,
    "petsNotes" TEXT,
    "occupancyApprox" INTEGER,
    "accessParkingNotes" TEXT,
    "suppliesProvidedBy" TEXT,
    "trashRequirements" TEXT,
    "laundryRequested" BOOLEAN,
    "bedMakingRequested" BOOLEAN,
    "lastProfessionalClean" TEXT,
    "specialInstructions" TEXT,
    "conditionFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditionOther" TEXT,
    "estimatedLaborHours" DECIMAL(6,2),
    "agreedPrice" DECIMAL(10,2),
    "pricingBasis" TEXT,
    "includedScope" TEXT,
    "exclusions" TEXT,
    "preExistingConditionNotes" TEXT,
    "approvedAddOns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_residential_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_residential_profiles_propertyId_key" ON "property_residential_profiles"("propertyId");

-- CreateIndex
CREATE INDEX "properties_useType_idx" ON "properties"("useType");

-- AddForeignKey
ALTER TABLE "property_residential_profiles" ADD CONSTRAINT "property_residential_profiles_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Match existing RLS posture (20260715094314_enable_rls_all_tables)
ALTER TABLE "property_residential_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_postgres_full_access" ON "property_residential_profiles" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "allow_service_role_full_access" ON "property_residential_profiles" FOR ALL TO service_role USING (true) WITH CHECK (true);
