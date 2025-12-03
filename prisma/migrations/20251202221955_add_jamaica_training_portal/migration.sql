-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ALTER COLUMN "country" SET DEFAULT 'US';

-- CreateTable
CREATE TABLE "JamaicaPayout" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JMD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JamaicaPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JamaicaPaymentMethod" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountType" TEXT,
    "whatsappNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JamaicaPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingLesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "quizJson" JSONB,

    CONSTRAINT "TrainingLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "score" INTEGER,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingStatus" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "overallStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "lastModuleSlug" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JamaicaPayout_cleanerId_idx" ON "JamaicaPayout"("cleanerId");

-- CreateIndex
CREATE INDEX "JamaicaPayout_branchId_idx" ON "JamaicaPayout"("branchId");

-- CreateIndex
CREATE INDEX "JamaicaPayout_status_idx" ON "JamaicaPayout"("status");

-- CreateIndex
CREATE INDEX "JamaicaPayout_periodStart_periodEnd_idx" ON "JamaicaPayout"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "JamaicaPaymentMethod_cleanerId_key" ON "JamaicaPaymentMethod"("cleanerId");

-- CreateIndex
CREATE INDEX "JamaicaPaymentMethod_cleanerId_idx" ON "JamaicaPaymentMethod"("cleanerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingModule_slug_key" ON "TrainingModule"("slug");

-- CreateIndex
CREATE INDEX "TrainingModule_slug_idx" ON "TrainingModule"("slug");

-- CreateIndex
CREATE INDEX "TrainingModule_order_idx" ON "TrainingModule"("order");

-- CreateIndex
CREATE INDEX "TrainingModule_isActive_idx" ON "TrainingModule"("isActive");

-- CreateIndex
CREATE INDEX "TrainingLesson_moduleId_idx" ON "TrainingLesson"("moduleId");

-- CreateIndex
CREATE INDEX "TrainingLesson_moduleId_order_idx" ON "TrainingLesson"("moduleId", "order");

-- CreateIndex
CREATE INDEX "LessonProgress_cleanerId_idx" ON "LessonProgress"("cleanerId");

-- CreateIndex
CREATE INDEX "LessonProgress_lessonId_idx" ON "LessonProgress"("lessonId");

-- CreateIndex
CREATE INDEX "LessonProgress_status_idx" ON "LessonProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_cleanerId_lessonId_key" ON "LessonProgress"("cleanerId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingStatus_cleanerId_key" ON "TrainingStatus"("cleanerId");

-- CreateIndex
CREATE INDEX "TrainingStatus_cleanerId_idx" ON "TrainingStatus"("cleanerId");

-- CreateIndex
CREATE INDEX "TrainingStatus_overallStatus_idx" ON "TrainingStatus"("overallStatus");

-- AddForeignKey
ALTER TABLE "JamaicaPayout" ADD CONSTRAINT "JamaicaPayout_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamaicaPayout" ADD CONSTRAINT "JamaicaPayout_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamaicaPaymentMethod" ADD CONSTRAINT "JamaicaPaymentMethod_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingLesson" ADD CONSTRAINT "TrainingLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "TrainingLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingStatus" ADD CONSTRAINT "TrainingStatus_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
