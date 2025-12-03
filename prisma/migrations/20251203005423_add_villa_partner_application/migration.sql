-- CreateTable
CREATE TABLE "VillaPartnerApplication" (
    "id" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "turnoverFrequency" TEXT NOT NULL,
    "needsInventory" BOOLEAN NOT NULL DEFAULT false,
    "needsLinenService" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VillaPartnerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VillaPartnerApplication_status_idx" ON "VillaPartnerApplication"("status");

-- CreateIndex
CREATE INDEX "VillaPartnerApplication_createdAt_idx" ON "VillaPartnerApplication"("createdAt");
