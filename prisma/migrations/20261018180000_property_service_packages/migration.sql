-- Property service packages, seasonal rates, and payment preferences.
-- Additive only. Do not apply until approved.
-- Does not modify Job, Invoice, InvoicePayment, or JobPayout.

CREATE TYPE "ServicePackageCategory" AS ENUM ('RESIDENTIAL', 'VACATION_RENTAL');

CREATE TYPE "PropertyPaymentMethod" AS ENUM ('CASH', 'CHECK', 'ZELLE', 'CARD');

CREATE TABLE "property_service_packages" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "serviceCategory" "ServicePackageCategory" NOT NULL,
    "serviceType" TEXT NOT NULL,
    "customerPrice" DECIMAL(10,2) NOT NULL,
    "operationalPrice" DECIMAL(10,2),
    "includedScope" TEXT,
    "exclusions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_service_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_service_rates" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "customerPrice" DECIMAL(10,2) NOT NULL,
    "operationalPrice" DECIMAL(10,2),
    "startsOn" DATE NOT NULL,
    "endsOn" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_service_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_payment_preferences" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "allowedMethods" "PropertyPaymentMethod"[] NOT NULL DEFAULT ARRAY[]::"PropertyPaymentMethod"[],
    "preferredMethod" "PropertyPaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_payment_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_service_packages_identity_key" ON "property_service_packages"("propertyId", "serviceCategory", "serviceType");

CREATE INDEX "property_service_packages_propertyId_idx" ON "property_service_packages"("propertyId");

CREATE INDEX "property_service_rates_packageId_startsOn_idx" ON "property_service_rates"("packageId", "startsOn");

CREATE UNIQUE INDEX "property_payment_preferences_propertyId_key" ON "property_payment_preferences"("propertyId");

ALTER TABLE "property_service_packages" ADD CONSTRAINT "property_service_packages_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_service_rates" ADD CONSTRAINT "property_service_rates_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "property_service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_payment_preferences" ADD CONSTRAINT "property_payment_preferences_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Match existing RLS posture (20260715094314_enable_rls_all_tables).
ALTER TABLE "property_service_packages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_postgres_full_access" ON "property_service_packages" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "allow_service_role_full_access" ON "property_service_packages" FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "property_service_rates" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_postgres_full_access" ON "property_service_rates" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "allow_service_role_full_access" ON "property_service_rates" FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "property_payment_preferences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_postgres_full_access" ON "property_payment_preferences" FOR ALL TO postgres USING (true) WITH CHECK (true);
CREATE POLICY "allow_service_role_full_access" ON "property_payment_preferences" FOR ALL TO service_role USING (true) WITH CHECK (true);
