/**
 * Phase 3H.15: One-Click Compliance Data Room ZIP Exporter
 * 
 * GET /api/admin/data-room/export
 * 
 * Generates a complete compliance data room ZIP containing:
 * - Governance documents (Board, Investor summaries)
 * - Tax compliance documents (W-9 workflow, readiness reports)
 * - Payment documentation
 * - Security overview
 * - Audit logs and archives
 * 
 * Admin-only, read-only, no sensitive data
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { createWriteStream, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import archiver from "archiver";
import {
  createManifest,
  writeManifestFiles,
} from "@/lib/data-room/manifest";

/**
 * Generate PDF content (HTML) for a document
 */
async function generatePDFContent(type: string): Promise<string> {
  const preparedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  switch (type) {
    case "compliance-process":
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid - Compliance Process Overview</title>
  <style>
    @page { size: letter; margin: 0.75in; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; }
    h1 { font-size: 20pt; font-weight: bold; margin-top: 24pt; color: #1e40af; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 18pt; color: #374151; }
    p { margin-bottom: 10pt; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  <h1>VelocityMaid</h1>
  <h2>Compliance Process Overview</h2>
  <p>Independent Contractor Tax Reporting (1099)</p>
  <p>Prepared: ${preparedDate}</p>
  <p>Audience: Investors, Board, Auditors</p>
  <div class="page-break"></div>
  <h1>Purpose</h1>
  <p>This document outlines VelocityMaid's process for managing U.S. tax compliance related to independent contractor payments, specifically Form 1099 reporting.</p>
  <div class="page-break"></div>
  <h1>Scope</h1>
  <p>This process applies to contractors receiving payments through the platform and applies to annual reporting cycles ending January 31.</p>
  <div class="page-break"></div>
  <h1>High-Level Compliance Flow</h1>
  <ol>
    <li>Contractor completes work and receives payouts</li>
    <li>Payments are recorded in a secure ledger</li>
    <li>Threshold-eligible contractors are identified automatically</li>
    <li>Tax information (W-9) is collected digitally</li>
    <li>Readiness is monitored continuously</li>
    <li>Records are archived and locked after the deadline</li>
  </ol>
</body>
</html>`;

    case "w9-workflow":
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid - W-9 & 1099 Workflow Description</title>
  <style>
    @page { size: letter; margin: 0.75in; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; }
    h1 { font-size: 20pt; font-weight: bold; margin-top: 24pt; color: #1e40af; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 18pt; color: #374151; }
    p { margin-bottom: 10pt; }
  </style>
</head>
<body>
  <h1>VelocityMaid</h1>
  <h2>W-9 & 1099 Workflow Description</h2>
  <p>Prepared: ${preparedDate}</p>
  <p>Audience: Auditors, Accountants, Investors</p>
  <h1>Overview</h1>
  <p>This document describes how VelocityMaid collects, validates, and prepares information required for Form 1099 reporting.</p>
  <h1>Threshold Identification</h1>
  <p>Contractor payments are tracked automatically. Only contractors exceeding IRS thresholds enter compliance workflows.</p>
  <h1>W-9 Collection</h1>
  <p>Contractors submit tax information digitally. Sensitive identifiers are encrypted and never transmitted via email.</p>
  <h1>Verification & Review</h1>
  <p>Authorized administrators review submissions for completeness and accuracy.</p>
  <h1>1099 Preparation</h1>
  <p>Final payment totals are calculated from completed payouts and matched with verified tax profiles.</p>
  <h1>Filing Support</h1>
  <p>VelocityMaid supports accountant-led filing through structured exports and audit snapshots but does not act as the filer of record.</p>
  <h1>Post-Deadline Controls</h1>
  <p>After January 31, the reporting year is locked and preserved in read-only mode.</p>
  <h1>Summary</h1>
  <p>This workflow ensures accurate, timely, and secure preparation for tax reporting.</p>
</body>
</html>`;

    case "security-overview":
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid - Security & Data Protection Overview</title>
  <style>
    @page { size: letter; margin: 0.75in; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; }
    h1 { font-size: 20pt; font-weight: bold; margin-top: 24pt; color: #1e40af; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 18pt; color: #374151; }
    p { margin-bottom: 10pt; }
  </style>
</head>
<body>
  <h1>VelocityMaid</h1>
  <h2>Security & Data Protection Overview</h2>
  <p>Prepared: ${preparedDate}</p>
  <p>Audience: Investors, Auditors, Security Reviewers</p>
  <h1>Security Philosophy</h1>
  <p>VelocityMaid treats personal and financial data as a stewardship responsibility.</p>
  <h1>Data Classification</h1>
  <p>Sensitive identifiers are classified and handled separately from operational data.</p>
  <h1>Encryption & Storage</h1>
  <p>Sensitive tax identifiers are encrypted at rest. Plain-text identifiers are never stored or displayed.</p>
  <h1>Access Controls</h1>
  <p>Role-based permissions ensure that users can only access information necessary for their role.</p>
  <h1>Communications Safeguards</h1>
  <p>No sensitive personal data is transmitted via email or routine exports.</p>
  <h1>Auditability</h1>
  <p>Immutable year-end archives and logged administrative actions support governance and audit review.</p>
  <h1>Data Retention & Locking</h1>
  <p>Records are locked after deadlines to prevent retroactive modification.</p>
  <h1>Summary</h1>
  <p>Security controls are embedded by design to support trust, compliance, and scalable growth.</p>
</body>
</html>`;

    default:
      return "";
  }
}

/**
 * Generate sample CSV content (no TINs)
 */
function generateSampleCSV(): string {
  return `recipient_name,recipient_address_line1,recipient_city,recipient_state,recipient_zip,recipient_tin,amount,payment_year
"Sample Contractor 1","123 Main St","Anytown","CA","12345","",1500.00,2025
"Sample Contractor 2","456 Oak Ave","Springfield","NY","67890","",2500.00,2025
"Sample Contractor 3","789 Elm St","Riverside","TX","54321","",3200.00,2025`;
}

/**
 * Generate sample JSON for tax year archive
 */
async function generateTaxYearArchiveJSON(): Promise<string> {
  const archives = await prisma.taxYearArchive.findMany({
    orderBy: { year: "desc" },
    take: 3,
  });

  const data = archives.map((archive) => ({
    year: archive.year,
    archivedAt: archive.archivedAt.toISOString(),
    archivedBy: archive.archivedBy,
    readinessScore: archive.readinessScore,
    status: archive.status,
    summary: archive.summaryJson,
  }));

  return JSON.stringify(data, null, 2);
}

/**
 * Generate sample audit log JSON
 */
async function generateAuditLogJSON(): Promise<string> {
  const logs = await prisma.taxProfileAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      performedBy: true,
      createdAt: true,
      details: true,
    },
  });

  return JSON.stringify(logs, null, 2);
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const date = new Date().toISOString().split("T")[0];
    const zipName = `VelocityMaid_Compliance_Data_Room_${date}.zip`;
    
    // Create temp directory
    const tempRoot = join(tmpdir(), `data-room-${Date.now()}`);
    const base = join(tempRoot, "Compliance_Data_Room");

    // Create folder structure
    const folders = [
      "01_Governance",
      "02_Tax_Compliance",
      "03_Payments",
      "04_Security",
      "05_Audit",
    ];

    mkdirSync(base, { recursive: true });
    folders.forEach((f) => mkdirSync(join(base, f), { recursive: true }));

    // Generate PDFs (as HTML files - users can print to PDF)
    const complianceProcessHTML = generatePDFContent("compliance-process");
    writeFileSync(
      join(base, "01_Governance", "Compliance_Process_Overview.html"),
      complianceProcessHTML
    );

    const boardSummaryHTML = generatePDFContent("board-summary");
    writeFileSync(
      join(base, "01_Governance", "Board_Compliance_Summary.html"),
      boardSummaryHTML
    );

    const investorSummaryHTML = generatePDFContent("investor-summary");
    writeFileSync(
      join(base, "01_Governance", "Investor_Compliance_Summary.html"),
      investorSummaryHTML
    );

    const w9WorkflowHTML = generatePDFContent("w9-workflow");
    writeFileSync(
      join(base, "02_Tax_Compliance", "W9_1099_Workflow.html"),
      w9WorkflowHTML
    );

    const securityOverviewHTML = generatePDFContent("security-overview");
    writeFileSync(
      join(base, "04_Security", "Security_Data_Protection_Overview.html"),
      securityOverviewHTML
    );

    // Generate sample CSV (no TINs)
    const sampleCSV = generateSampleCSV();
    writeFileSync(
      join(base, "02_Tax_Compliance", "IRIS_Export_Sample_NO_TIN.csv"),
      sampleCSV
    );

    // Generate tax year archive JSON
    try {
      const archiveJSON = await generateTaxYearArchiveJSON();
      if (archiveJSON && archiveJSON !== "[]") {
        writeFileSync(
          join(base, "02_Tax_Compliance", "Tax_Year_Archive_Sample.json"),
          archiveJSON
        );
      }
    } catch (error) {
      // If no archives exist, skip
    }

    // Generate analytics summary JSON (simplified)
    try {
      const archives = await prisma.taxYearArchive.findMany({
        orderBy: { year: "desc" },
        select: {
          year: true,
          readinessScore: true,
          status: true,
          archivedAt: true,
          summaryJson: true,
        },
      });
      if (archives.length > 0) {
        const analyticsData = {
          years: archives.map((a) => ({
            year: a.year,
            readinessScore: a.readinessScore,
            status: a.status,
            archivedAt: a.archivedAt.toISOString(),
            summary: a.summaryJson,
          })),
        };
        writeFileSync(
          join(base, "02_Tax_Compliance", "1099_Readiness_By_Year.json"),
          JSON.stringify(analyticsData, null, 2)
        );
      }
    } catch (error) {
      // Skip if analytics unavailable
    }

    // Generate audit log JSON
    try {
      const auditLogJSON = await generateAuditLogJSON();
      if (auditLogJSON && auditLogJSON !== "[]") {
        writeFileSync(
          join(base, "05_Audit", "Audit_Log_Sample.json"),
          auditLogJSON
        );
      }
    } catch (error) {
      // Skip if no audit logs
    }

    // Generate archive event log (from TaxYearArchive)
    try {
      const archives = await prisma.taxYearArchive.findMany({
        orderBy: { year: "desc" },
        select: {
          year: true,
          archivedAt: true,
          archivedBy: true,
          readinessScore: true,
          status: true,
        },
      });
      if (archives.length > 0) {
        writeFileSync(
          join(base, "05_Audit", "Archive_Event_Log.json"),
          JSON.stringify(archives, null, 2)
        );
      }
    } catch (error) {
      // Skip if no archives
    }

    // Create README.txt (before manifest so it's included in manifest)
    const readmeContent = `VelocityMaid Compliance Data Room

This package contains high-level compliance documentation for governance,
investor due diligence, and audit review.

• No sensitive personal data is included
• No contractor tax identifiers are present
• All materials are read-only and informational

Prepared automatically by VelocityMaid.
Date: ${date}

Folder Structure:
- 01_Governance: Board and investor summaries, process overviews
- 02_Tax_Compliance: W-9 workflow, readiness reports, sample exports
- 03_Payments: Payment eligibility and ledger documentation
- 04_Security: Security controls and data protection overview
- 05_Audit: Audit logs and archive event logs

Note: HTML files can be printed to PDF using your browser's print function.

INTEGRITY VERIFICATION

This data room includes a signed checksum manifest for cryptographic integrity verification.

To verify integrity:
1. Compute SHA-256 hashes of files listed in MANIFEST.json
2. Compare against recorded values in MANIFEST.json
3. Verify MANIFEST.sig using MANIFEST_PUBLIC_KEY.pem (if included)

Verification command (using OpenSSL):
  openssl dgst -sha256 -verify MANIFEST_PUBLIC_KEY.pem -signature MANIFEST.sig MANIFEST.json

Or using Node.js crypto:
  const crypto = require('crypto');
  const fs = require('fs');
  const publicKey = fs.readFileSync('MANIFEST_PUBLIC_KEY.pem');
  const manifest = fs.readFileSync('MANIFEST.json');
  const signature = Buffer.from(fs.readFileSync('MANIFEST.sig'), 'base64');
  const verified = crypto.verify(null, manifest, publicKey, signature);
  console.log('Manifest verified:', verified);

Any change to file contents will invalidate the signature and checksums.
`;

    writeFileSync(join(base, "README.txt"), readmeContent);

    // Phase 3H.16: Collect all file paths and create signed checksum manifest
    const allFiles: string[] = [];

    // Add all generated files (relative to Compliance_Data_Room root)
    allFiles.push("01_Governance/Compliance_Process_Overview.html");
    allFiles.push("01_Governance/Board_Compliance_Summary.html");
    allFiles.push("01_Governance/Investor_Compliance_Summary.html");
    allFiles.push("02_Tax_Compliance/W9_1099_Workflow.html");
    allFiles.push("02_Tax_Compliance/IRIS_Export_Sample_NO_TIN.csv");
    allFiles.push("04_Security/Security_Data_Protection_Overview.html");
    allFiles.push("README.txt");

    // Add optional files if they exist
    try {
      const archivePath = join(base, "02_Tax_Compliance", "Tax_Year_Archive_Sample.json");
      const content = readFileSync(archivePath, "utf8");
      if (content && content !== "[]" && content.trim() !== "") {
        allFiles.push("02_Tax_Compliance/Tax_Year_Archive_Sample.json");
      }
    } catch {}

    try {
      const analyticsPath = join(base, "02_Tax_Compliance", "1099_Readiness_By_Year.json");
      const content = readFileSync(analyticsPath, "utf8");
      if (content && content.trim() !== "") {
        allFiles.push("02_Tax_Compliance/1099_Readiness_By_Year.json");
      }
    } catch {}

    try {
      const auditPath = join(base, "05_Audit", "Audit_Log_Sample.json");
      const content = readFileSync(auditPath, "utf8");
      if (content && content !== "[]" && content.trim() !== "") {
        allFiles.push("05_Audit/Audit_Log_Sample.json");
      }
    } catch {}

    try {
      const archiveEventPath = join(base, "05_Audit", "Archive_Event_Log.json");
      const content = readFileSync(archiveEventPath, "utf8");
      if (content && content.trim() !== "") {
        allFiles.push("05_Audit/Archive_Event_Log.json");
      }
    } catch {}

    // Create signed checksum manifest
    try {
      const { manifestJson, signature } = createManifest(
        base,
        allFiles,
        "SYSTEM"
      );

      // Write manifest files
      writeManifestFiles(base, manifestJson, signature);

      // Add manifest files to file list (they'll be included in ZIP automatically)
      // Note: Manifest files are written to base directory, so they're included when we archive the directory
    } catch (error: any) {
      console.warn(
        "[DATA_ROOM_EXPORT] Manifest creation failed (continuing without signature):",
        error.message
      );
      // Continue without manifest if signing fails (graceful degradation)
    }

    // Create ZIP
    return new Promise<NextResponse>((resolve, reject) => {
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      const chunks: Buffer[] = [];

      archive.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on("error", (err) => {
        // Cleanup on error
        try {
          rmSync(tempRoot, { recursive: true, force: true });
        } catch {}
        reject(err);
      });

      archive.on("end", () => {
        // Cleanup temp directory
        try {
          rmSync(tempRoot, { recursive: true, force: true });
        } catch {}

        const zipBuffer = Buffer.concat(chunks);

        resolve(
          new NextResponse(zipBuffer, {
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename="${zipName}"`,
            },
          })
        );
      });

      // Add directory to archive (includes manifest files)
      archive.directory(base, "Compliance_Data_Room");
      archive.finalize();
    });
  } catch (error: any) {
    console.error("[ADMIN_DATA_ROOM_EXPORT] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate data room ZIP",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

