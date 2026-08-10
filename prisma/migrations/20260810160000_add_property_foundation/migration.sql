-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "approximateSquareFeet" INTEGER,
    "bedConfiguration" TEXT,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "restrictedAreas" TEXT,
    "accessType" TEXT,
    "accessNotes" TEXT,
    "supplyStorageLocation" TEXT,
    "trashInstructions" TEXT,
    "linenInstructions" TEXT,
    "standardCheckoutTime" TEXT,
    "standardCheckinTime" TEXT,
    "turnoverFrequency" TEXT,
    "sameDayTurnovers" TEXT,
    "standingInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "propertyId" TEXT;

-- CreateIndex
CREATE INDEX "properties_customerId_idx" ON "properties"("customerId");

-- CreateIndex
CREATE INDEX "properties_customerId_address_idx" ON "properties"("customerId", "address");

-- CreateIndex
CREATE INDEX "Job_propertyId_idx" ON "Job"("propertyId");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Match existing RLS posture (20260715094314_enable_rls_all_tables)
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_postgres_full_access" ON "properties" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "allow_service_role_full_access" ON "properties" FOR ALL TO service_role USING (true) WITH CHECK (true);
