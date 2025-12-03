-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "promoApplied" TEXT,
ADD COLUMN     "promoDiscount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promo_branchId_idx" ON "Promo"("branchId");

-- CreateIndex
CREATE INDEX "Promo_active_idx" ON "Promo"("active");

-- CreateIndex
CREATE INDEX "Promo_startDate_endDate_idx" ON "Promo"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Promo_month_year_idx" ON "Promo"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Promo_branchId_month_year_key" ON "Promo"("branchId", "month", "year");

-- AddForeignKey
ALTER TABLE "Promo" ADD CONSTRAINT "Promo_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
