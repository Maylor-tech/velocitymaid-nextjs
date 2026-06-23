-- CreateTable
CREATE TABLE "tips" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "guestName" TEXT,
    "guestMessage" TEXT,
    "cleanerName" TEXT,
    "propertyAddress" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "market" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tips_stripePaymentIntentId_key" ON "tips"("stripePaymentIntentId");

-- RenameForeignKey
ALTER TABLE "TrainingStatus" RENAME CONSTRAINT "TrainingStatus_cleanerId_fkey" TO "TrainingStatus_cleanerId_User_fkey";
