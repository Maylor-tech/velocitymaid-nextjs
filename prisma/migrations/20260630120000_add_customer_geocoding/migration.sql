-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Customer_latitude_longitude_idx" ON "Customer"("latitude", "longitude");
