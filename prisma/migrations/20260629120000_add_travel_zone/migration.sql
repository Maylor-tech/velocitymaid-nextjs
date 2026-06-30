-- CreateEnum
CREATE TYPE "TravelZone" AS ENUM ('ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "travelZone" "TravelZone";

-- CreateIndex
CREATE INDEX "Customer_travelZone_idx" ON "Customer"("travelZone");

-- CreateTable
CREATE TABLE "admin_platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "invoiceQuickAddItems" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_platform_settings_pkey" PRIMARY KEY ("id")
);

-- Seed default settings row
INSERT INTO "admin_platform_settings" ("id", "invoiceQuickAddItems", "updatedAt")
VALUES (
  'default',
  '[
    {"key":"office_prep","label":"Office Prep $75","description":"Office Prep","amount":75},
    {"key":"garage_cleanup","label":"Garage Cleanup $75","description":"Garage Cleanup","amount":75},
    {"key":"grill_deep_clean","label":"Grill Deep Clean $75","description":"Grill Deep Clean","amount":75},
    {"key":"zone_b_travel","label":"Zone B Travel $20","description":"Zone B Travel Fee","amount":20},
    {"key":"zone_c_travel","label":"Zone C Travel $40","description":"Zone C Travel Fee","amount":40},
    {"key":"checkout_presence","label":"Checkout Presence $25","description":"Checkout Presence","amount":25}
  ]'::jsonb,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
