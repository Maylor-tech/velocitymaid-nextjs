-- CreateTable
CREATE TABLE "CleanerPaymentMethod" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "label" TEXT,
    "details" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CleanerPaymentMethod_cleanerId_isActive_idx" ON "CleanerPaymentMethod"("cleanerId", "isActive");

-- CreateIndex
CREATE INDEX "CleanerPaymentMethod_cleanerId_idx" ON "CleanerPaymentMethod"("cleanerId");

-- AddForeignKey
ALTER TABLE "CleanerPaymentMethod" ADD CONSTRAINT "CleanerPaymentMethod_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;














