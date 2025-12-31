-- CreateTable
CREATE TABLE "ContactReply" (
    "id" TEXT NOT NULL,
    "contactMessageId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "repliedByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContactReply" ADD CONSTRAINT "ContactReply_contactMessageId_fkey" FOREIGN KEY ("contactMessageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

