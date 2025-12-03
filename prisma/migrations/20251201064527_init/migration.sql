-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CLEANER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'COMING_SOON', 'PAUSED');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('HOURLY', 'FLAT', 'TIERED');

-- CreateEnum
CREATE TYPE "BaseRateType" AS ENUM ('PER_HOUR', 'PER_JOB', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "TipHandling" AS ENUM ('PASS_THROUGH', 'SPLIT', 'POOL');

-- CreateEnum
CREATE TYPE "SopCategory" AS ENUM ('OPS', 'SALES', 'QC', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "CleanerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FranchiseApplicationStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLEANER',
    "primaryBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "defaultAddress" TEXT,
    "homeZipCode" TEXT,
    "branchId" TEXT,
    "stripeCustomerId" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "regionLabel" TEXT,
    "timezone" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "managerId" TEXT,
    "pricingModelId" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'COMING_SOON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchServiceArea" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingType" "BillingType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "baseRate" DECIMAL(10,2) NOT NULL,
    "extraHourRate" DECIMAL(10,2),
    "minHours" INTEGER,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchServicePackage" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDurationHours" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchConfig" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bookingEmail" TEXT,
    "supportEmail" TEXT,
    "maxDailyJobs" INTEGER,
    "whatsappTemplateConfig" JSONB,
    "zapierHooks" JSONB,
    "operationsFlags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchAutomationConfig" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bookingWebhookUrl" TEXT,
    "reminderWebhookUrl" TEXT,
    "reviewWebhookUrl" TEXT,
    "whatsappTemplateBooking" TEXT,
    "whatsappTemplateReminder" TEXT,
    "whatsappTemplateReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchAutomationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchLandingContent" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "headline" TEXT,
    "subheadline" TEXT,
    "heroImageUrl" TEXT,
    "localCtaLabel" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "testimonials" JSONB,
    "faqEntries" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchLandingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchPayoutRules" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "baseRateType" "BaseRateType" NOT NULL,
    "baseRateValue" DECIMAL(10,2) NOT NULL,
    "overtimeRules" JSONB,
    "tipHandling" "TipHandling" NOT NULL,
    "franchiseFeePercentage" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchPayoutRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchSops" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "category" "SopCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "docUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchSops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchOnboardingResources" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchOnboardingResources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT,
    "assignedCleanerId" TEXT,
    "customerName" TEXT,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "serviceType" TEXT,
    "serviceLocation" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "onTheWayAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "experienceLevel" TEXT,
    "daysAvailable" JSONB,
    "notes" TEXT,
    "status" "CleanerApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "desiredBranchSlug" TEXT,
    "background" TEXT,
    "investmentCapacityRange" TEXT,
    "notes" TEXT,
    "status" "FranchiseApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_primaryBranchId_idx" ON "User"("primaryBranchId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "UserBranch_userId_idx" ON "UserBranch"("userId");

-- CreateIndex
CREATE INDEX "UserBranch_branchId_idx" ON "UserBranch"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBranch_userId_branchId_key" ON "UserBranch"("userId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_stripeCustomerId_key" ON "Customer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_branchId_idx" ON "Customer"("branchId");

-- CreateIndex
CREATE INDEX "Customer_homeZipCode_idx" ON "Customer"("homeZipCode");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE INDEX "Branch_slug_idx" ON "Branch"("slug");

-- CreateIndex
CREATE INDEX "Branch_status_idx" ON "Branch"("status");

-- CreateIndex
CREATE INDEX "Branch_managerId_idx" ON "Branch"("managerId");

-- CreateIndex
CREATE INDEX "Branch_pricingModelId_idx" ON "Branch"("pricingModelId");

-- CreateIndex
CREATE INDEX "BranchServiceArea_branchId_idx" ON "BranchServiceArea"("branchId");

-- CreateIndex
CREATE INDEX "BranchServiceArea_zipCode_idx" ON "BranchServiceArea"("zipCode");

-- CreateIndex
CREATE INDEX "BranchServiceArea_zipCode_priority_idx" ON "BranchServiceArea"("zipCode", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "BranchServiceArea_branchId_zipCode_key" ON "BranchServiceArea"("branchId", "zipCode");

-- CreateIndex
CREATE INDEX "PricingModel_name_idx" ON "PricingModel"("name");

-- CreateIndex
CREATE INDEX "BranchServicePackage_branchId_idx" ON "BranchServicePackage"("branchId");

-- CreateIndex
CREATE INDEX "BranchServicePackage_branchId_isActive_idx" ON "BranchServicePackage"("branchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BranchServicePackage_branchId_code_key" ON "BranchServicePackage"("branchId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BranchConfig_branchId_key" ON "BranchConfig"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchAutomationConfig_branchId_key" ON "BranchAutomationConfig"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchLandingContent_branchId_key" ON "BranchLandingContent"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchPayoutRules_branchId_key" ON "BranchPayoutRules"("branchId");

-- CreateIndex
CREATE INDEX "BranchSops_branchId_idx" ON "BranchSops"("branchId");

-- CreateIndex
CREATE INDEX "BranchSops_branchId_category_idx" ON "BranchSops"("branchId", "category");

-- CreateIndex
CREATE INDEX "BranchOnboardingResources_branchId_idx" ON "BranchOnboardingResources"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_sessionId_key" ON "Job"("sessionId");

-- CreateIndex
CREATE INDEX "Job_branchId_idx" ON "Job"("branchId");

-- CreateIndex
CREATE INDEX "Job_assignedCleanerId_idx" ON "Job"("assignedCleanerId");

-- CreateIndex
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_preferredDate_idx" ON "Job"("preferredDate");

-- CreateIndex
CREATE INDEX "CleanerApplication_branchId_idx" ON "CleanerApplication"("branchId");

-- CreateIndex
CREATE INDEX "CleanerApplication_status_idx" ON "CleanerApplication"("status");

-- CreateIndex
CREATE INDEX "CleanerApplication_email_idx" ON "CleanerApplication"("email");

-- CreateIndex
CREATE INDEX "FranchiseApplication_status_idx" ON "FranchiseApplication"("status");

-- CreateIndex
CREATE INDEX "FranchiseApplication_email_idx" ON "FranchiseApplication"("email");

-- CreateIndex
CREATE INDEX "FranchiseApplication_city_state_idx" ON "FranchiseApplication"("city", "state");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_pricingModelId_fkey" FOREIGN KEY ("pricingModelId") REFERENCES "PricingModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchServiceArea" ADD CONSTRAINT "BranchServiceArea_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchServicePackage" ADD CONSTRAINT "BranchServicePackage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchConfig" ADD CONSTRAINT "BranchConfig_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchAutomationConfig" ADD CONSTRAINT "BranchAutomationConfig_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchLandingContent" ADD CONSTRAINT "BranchLandingContent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPayoutRules" ADD CONSTRAINT "BranchPayoutRules_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchSops" ADD CONSTRAINT "BranchSops_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchOnboardingResources" ADD CONSTRAINT "BranchOnboardingResources_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerApplication" ADD CONSTRAINT "CleanerApplication_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
