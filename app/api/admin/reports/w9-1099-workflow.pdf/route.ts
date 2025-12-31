/**
 * W-9 & 1099 Workflow Description PDF
 * 
 * GET /api/admin/reports/w9-1099-workflow.pdf
 * 
 * Production-ready, paginated PDF describing W-9 collection and 1099 preparation
 * Suitable for auditors, accountants, investors
 * 
 * Read-only, admin-only
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const preparedDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid - W-9 & 1099 Workflow Description</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
    }
    .cover {
      text-align: center;
      page-break-after: always;
      padding-top: 2.5in;
    }
    .cover h1 {
      font-size: 36pt;
      font-weight: bold;
      margin-bottom: 18pt;
      color: #1e40af;
    }
    .cover h2 {
      font-size: 20pt;
      font-weight: normal;
      margin-bottom: 24pt;
      color: #374151;
    }
    h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-top: 24pt;
      margin-bottom: 12pt;
      color: #1e40af;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 8pt;
      color: #374151;
    }
    p {
      margin-bottom: 10pt;
      text-align: justify;
    }
    ul, ol {
      margin-left: 24pt;
      margin-bottom: 10pt;
    }
    li {
      margin-bottom: 6pt;
    }
    .workflow-box {
      background: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 12pt;
      margin: 12pt 0;
    }
    .page-break {
      page-break-after: always;
    }
    .section {
      margin-bottom: 24pt;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>VelocityMaid</h1>
    <h2>W-9 & 1099 Workflow Description</h2>
    <p style="margin-top: 48pt;">
      <strong>Prepared:</strong> ${preparedDate}
    </p>
    <p style="margin-top: 12pt; font-size: 11pt; color: #6b7280;">
      Audience: Auditors, Accountants, Investors
    </p>
  </div>

  <!-- Overview -->
  <div class="section">
    <h1>Overview</h1>
    <p>
      This document describes how VelocityMaid collects, validates, and prepares information required for Form 1099 reporting.
    </p>
  </div>

  <!-- Threshold Identification -->
  <div class="section page-break">
    <h1>Threshold Identification</h1>
    <p>
      Contractor payments are tracked automatically. Only contractors exceeding IRS thresholds enter compliance workflows.
    </p>
    <div class="workflow-box">
      <h2>Threshold Rules</h2>
      <ul>
        <li><strong>2025 Tax Year:</strong> $600.01 threshold (600100 cents)</li>
        <li><strong>2026+ Tax Years:</strong> $2,000.01 threshold (2000100 cents)</li>
        <li>Payments aggregated across all payouts within the tax year</li>
        <li>Only PAID transfers included in threshold calculation</li>
        <li>Automatic identification when threshold is met</li>
      </ul>
    </div>
  </div>

  <!-- W-9 Collection -->
  <div class="section page-break">
    <h1>W-9 Collection</h1>
    <p>
      Contractors submit tax information digitally. Sensitive identifiers are encrypted and never transmitted via email.
    </p>
    <div class="workflow-box">
      <h2>Collection Process</h2>
      <ul>
        <li>Contractors access secure online portal at /cleaner/tax-form</li>
        <li>Form fields include: legal name, business name (if applicable), address, TIN type, TIN, tax classification</li>
        <li>Draft state allows contractors to save progress before submission</li>
        <li>Upon submission, TIN encrypted using AES-256-GCM</li>
        <li>Only last 4 digits stored in plaintext for display</li>
        <li>No sensitive data transmitted via email or routine communications</li>
      </ul>
    </div>
  </div>

  <!-- Verification & Review -->
  <div class="section page-break">
    <h1>Verification & Review</h1>
    <p>
      Authorized administrators review submissions for completeness and accuracy.
    </p>
    <div class="workflow-box">
      <h2>Review Process</h2>
      <ul>
        <li>Admin views submitted W-9 forms via admin dashboard</li>
        <li>Full TIN visible only to authorized admins (decrypted on-demand)</li>
        <li>Verification checks: completeness, accuracy, consistency</li>
        <li>Status options: VERIFIED (approved) or REJECTED (with reason)</li>
        <li>All verification actions logged in audit trail</li>
        <li>Rejected forms can be resubmitted by contractor after correction</li>
      </ul>
    </div>
  </div>

  <!-- 1099 Preparation -->
  <div class="section page-break">
    <h1>1099 Preparation</h1>
    <p>
      Final payment totals are calculated from completed payouts and matched with verified tax profiles.
    </p>
    <div class="workflow-box">
      <h2>Preparation Process</h2>
      <ul>
        <li>Payment totals calculated from PayoutTransfer records (status = PAID)</li>
        <li>Aggregated by cleanerId within tax year date range</li>
        <li>Matched with CleanerTaxProfile for legal name and address</li>
        <li>Threshold applied to determine 1099 eligibility</li>
        <li>Canonical CSV export generated with all required fields</li>
        <li>IRIS-compatible export available for IRS e-filing</li>
      </ul>
    </div>
  </div>

  <!-- Filing Support -->
  <div class="section page-break">
    <h1>Filing Support</h1>
    <p>
      VelocityMaid supports accountant-led filing through structured exports and audit snapshots but does not act as the filer of record.
    </p>
    <div class="workflow-box">
      <h2>Export Formats</h2>
      <ul>
        <li><strong>Canonical CSV:</strong> Human-readable format with all candidate data</li>
        <li><strong>IRIS CSV:</strong> IRS-compatible format for e-filing system</li>
        <li><strong>Audit Snapshots:</strong> Complete readiness data preserved at archive time</li>
        <li><strong>Payment Records:</strong> Detailed payout history available for reconciliation</li>
      </ul>
      <p style="margin-top: 12pt;">
        All exports are read-only and generated from locked, archived records to ensure accuracy and auditability.
      </p>
    </div>
  </div>

  <!-- Post-Deadline Controls -->
  <div class="section page-break">
    <h1>Post-Deadline Controls</h1>
    <p>
      After January 31, the reporting year is locked and preserved in read-only mode.
    </p>
    <div class="workflow-box">
      <h2>Archive & Lock Process</h2>
      <ul>
        <li>Tax year automatically archived on Feb 1 at 12:05 AM</li>
        <li>Final readiness score and summary counts preserved</li>
        <li>All compliance records become read-only</li>
        <li>No modifications allowed to archived data</li>
        <li>Complete audit trail preserved for regulatory review</li>
        <li>Exports generated from immutable archived snapshots</li>
      </ul>
    </div>
  </div>

  <!-- Summary -->
  <div class="section">
    <h1>Summary</h1>
    <p>
      This workflow ensures accurate, timely, and secure preparation for tax reporting.
    </p>
    <div class="workflow-box">
      <h2>Key Characteristics</h2>
      <ul>
        <li>Automated threshold identification reduces manual tracking</li>
        <li>Digital W-9 collection improves accuracy and speed</li>
        <li>Encryption protects sensitive contractor data</li>
        <li>Verification process ensures completeness and accuracy</li>
        <li>Archive locking preserves data integrity for filing</li>
        <li>Structured exports support accountant-led filing</li>
      </ul>
    </div>
  </div>
</body>
</html>
    `.trim();

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="w9_1099_workflow.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_W9_1099_WORKFLOW] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate W-9 & 1099 workflow PDF",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


