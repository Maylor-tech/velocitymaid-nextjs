-- CreateTable
CREATE TABLE "ContactInternalNote" (
    "id" TEXT NOT NULL,
    "contactMessageId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactInternalNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContactInternalNote" ADD CONSTRAINT "ContactInternalNote_contactMessageId_fkey" FOREIGN KEY ("contactMessageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

