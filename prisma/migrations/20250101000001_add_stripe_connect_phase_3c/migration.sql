-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeAccountId" TEXT,
ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripeOnboardingStatus" TEXT,
ADD COLUMN "stripeRequirementsDueCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "stripeLastAccountUpdateAt" TIMESTAMP(3);


