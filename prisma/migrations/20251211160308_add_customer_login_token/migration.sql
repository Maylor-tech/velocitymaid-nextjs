-- CreateTable
CREATE TABLE "CustomerLoginToken" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerLoginToken_customerId_idx" ON "CustomerLoginToken"("customerId");

-- CreateIndex
CREATE INDEX "CustomerLoginToken_code_customerId_idx" ON "CustomerLoginToken"("code", "customerId");

-- AddForeignKey
ALTER TABLE "CustomerLoginToken" ADD CONSTRAINT "CustomerLoginToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
