/*
  Warnings:

  - You are about to alter the column `phone` on the `Customer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "addressLine1" VARCHAR(255),
ADD COLUMN     "addressLine2" VARCHAR(255),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySMS" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postalCode" VARCHAR(20),
ADD COLUMN     "state" VARCHAR(100),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(50);
