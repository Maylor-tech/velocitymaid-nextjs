-- CreateTable
CREATE TABLE "ContactReplyTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReplyTemplate_pkey" PRIMARY KEY ("id")
);

