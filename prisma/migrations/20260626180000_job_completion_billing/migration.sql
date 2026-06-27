-- Job completion reports, receipts, and invoice-job linking

CREATE TYPE "CompletionReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT');
CREATE TYPE "ReceiptStatus" AS ENUM ('GENERATED', 'SENT');

ALTER TABLE "Invoice" ADD COLUMN "jobId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "customerId" TEXT;

CREATE UNIQUE INDEX "Invoice_jobId_key" ON "Invoice"("jobId");
CREATE INDEX "Invoice_jobId_idx" ON "Invoice"("jobId");
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "completion_reports" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT,
    "teamSummary" TEXT,
    "notes" TEXT,
    "issuesFound" TEXT,
    "supplyRequests" TEXT,
    "beforePhotos" JSONB,
    "afterPhotos" JSONB,
    "status" "CompletionReportStatus" NOT NULL DEFAULT 'GENERATED',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "completion_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "invoiceId" TEXT,
    "jobId" TEXT,
    "invoicePaymentId" TEXT,
    "customerId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "InvoicePaymentMethod" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "propertyAddress" TEXT,
    "serviceType" TEXT,
    "invoiceNumber" TEXT,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'GENERATED',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "completion_reports_jobId_key" ON "completion_reports"("jobId");
CREATE UNIQUE INDEX "completion_reports_reportNumber_key" ON "completion_reports"("reportNumber");
CREATE UNIQUE INDEX "completion_reports_publicToken_key" ON "completion_reports"("publicToken");
CREATE INDEX "completion_reports_status_idx" ON "completion_reports"("status");
CREATE INDEX "completion_reports_publicToken_idx" ON "completion_reports"("publicToken");

CREATE UNIQUE INDEX "receipts_receiptNumber_key" ON "receipts"("receiptNumber");
CREATE UNIQUE INDEX "receipts_publicToken_key" ON "receipts"("publicToken");
CREATE UNIQUE INDEX "receipts_invoicePaymentId_key" ON "receipts"("invoicePaymentId");
CREATE INDEX "receipts_jobId_idx" ON "receipts"("jobId");
CREATE INDEX "receipts_invoiceId_idx" ON "receipts"("invoiceId");
CREATE INDEX "receipts_customerId_idx" ON "receipts"("customerId");
CREATE INDEX "receipts_publicToken_idx" ON "receipts"("publicToken");

ALTER TABLE "completion_reports" ADD CONSTRAINT "completion_reports_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_invoicePaymentId_fkey" FOREIGN KEY ("invoicePaymentId") REFERENCES "InvoicePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
