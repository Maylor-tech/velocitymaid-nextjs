-- CreateEnum
CREATE TYPE "PipelineLeadStage" AS ENUM ('NEW_LEAD', 'CONTACTED', 'DISCOVERY_CALL', 'QUOTE_SENT', 'FOLLOW_UP', 'WON', 'ACTIVE_CLIENT', 'LOST');

-- CreateEnum
CREATE TYPE "PipelineLeadTaskType" AS ENUM ('FOLLOW_UP', 'QUOTE_REMINDER', 'ONBOARDING');

-- CreateEnum
CREATE TYPE "PipelineLeadTaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "CleanerApplication" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "pipeline_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "propertyAddress" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "propertyType" TEXT,
    "leadSource" TEXT,
    "estimatedRevenue" DECIMAL(10,2),
    "notes" TEXT,
    "stage" "PipelineLeadStage" NOT NULL DEFAULT 'NEW_LEAD',
    "nextActionDate" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_lead_tasks" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "PipelineLeadTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "PipelineLeadTaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_lead_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_leads_stage_idx" ON "pipeline_leads"("stage");

-- CreateIndex
CREATE INDEX "pipeline_leads_nextActionDate_idx" ON "pipeline_leads"("nextActionDate");

-- CreateIndex
CREATE INDEX "pipeline_leads_createdAt_idx" ON "pipeline_leads"("createdAt");

-- CreateIndex
CREATE INDEX "pipeline_lead_tasks_leadId_idx" ON "pipeline_lead_tasks"("leadId");

-- CreateIndex
CREATE INDEX "pipeline_lead_tasks_dueAt_idx" ON "pipeline_lead_tasks"("dueAt");

-- CreateIndex
CREATE INDEX "pipeline_lead_tasks_status_idx" ON "pipeline_lead_tasks"("status");

-- AddForeignKey
ALTER TABLE "pipeline_lead_tasks" ADD CONSTRAINT "pipeline_lead_tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "pipeline_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
