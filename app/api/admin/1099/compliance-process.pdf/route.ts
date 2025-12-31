/**
 * Compliance Process Overview PDF
 * 
 * GET /api/admin/1099/compliance-process.pdf
 * 
 * Production-ready, paginated PDF documenting the compliance process
 * Suitable for investors, board, auditors
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
  <title>VelocityMaid - Compliance Process Documentation</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Arial', sans-serif;
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
    h3 {
      font-size: 13pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
      color: #4b5563;
    }
    p {
      margin-bottom: 10pt;
    }
    ul, ol {
      margin-left: 24pt;
      margin-bottom: 10pt;
    }
    li {
      margin-bottom: 6pt;
    }
    .process-box {
      background: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 12pt;
      margin: 12pt 0;
    }
    .step {
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: 4pt;
      padding: 12pt;
      margin: 8pt 0;
    }
    .step-number {
      display: inline-block;
      width: 24pt;
      height: 24pt;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24pt;
      font-weight: bold;
      margin-right: 8pt;
    }
    .timeline {
      border-left: 3px solid #3b82f6;
      padding-left: 16pt;
      margin: 16pt 0;
    }
    .timeline-item {
      margin-bottom: 16pt;
      position: relative;
    }
    .timeline-item:before {
      content: "";
      position: absolute;
      left: -20pt;
      top: 4pt;
      width: 12pt;
      height: 12pt;
      background: #3b82f6;
      border-radius: 50%;
    }
    .page-break {
      page-break-after: always;
    }
    .section {
      margin-bottom: 24pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 10pt;
    }
    th {
      background: #f3f4f6;
      border: 1px solid #9ca3af;
      padding: 8pt;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid #d1d5db;
      padding: 8pt;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>VelocityMaid</h1>
    <h2>Compliance Process Overview</h2>
    <p style="margin-top: 48pt; font-size: 14pt; color: #6b7280;">
      Independent Contractor Tax Reporting (1099)
    </p>
    <p style="margin-top: 24pt;">
      <strong>Prepared:</strong> ${preparedDate}
    </p>
    <p style="margin-top: 12pt; font-size: 11pt; color: #6b7280;">
      Audience: Investors, Board, Auditors
    </p>
  </div>

  <!-- Purpose -->
  <div class="section">
    <h1>Purpose</h1>
    <p>
      This document outlines VelocityMaid's process for managing U.S. tax compliance related to independent contractor payments, specifically Form 1099 reporting.
    </p>
  </div>

  <!-- Scope -->
  <div class="section page-break">
    <h1>Scope</h1>
    <p>
      This process applies to contractors receiving payments through the platform and applies to annual reporting cycles ending January 31.
    </p>
  </div>

  <!-- High-Level Compliance Flow -->
  <div class="section page-break">
    <h1>High-Level Compliance Flow</h1>
    <ol style="font-size: 12pt; line-height: 1.8;">
      <li>Contractor completes work and receives payouts</li>
      <li>Payments are recorded in a secure ledger</li>
      <li>Threshold-eligible contractors are identified automatically</li>
      <li>Tax information (W-9) is collected digitally</li>
      <li>Readiness is monitored continuously</li>
      <li>Records are archived and locked after the deadline</li>
    </ol>
  </div>

  <!-- Contractor Tax Information Collection (W-9) -->
  <div class="section page-break">
    <h1>Contractor Tax Information Collection (W-9)</h1>
    <p>
      Tax information is collected via a secure digital form with encryption, certification, and role-based review.
    </p>
    <div class="process-box">
      <h3>Collection Process</h3>
      <ul>
        <li>Contractors access secure online portal to complete W-9 form</li>
        <li>Data collected in draft state before final submission</li>
        <li>Upon submission, Tax Identification Numbers (TINs) encrypted using AES-256-GCM</li>
        <li>Only last 4 digits stored in plaintext for display purposes</li>
        <li>Authorized administrators review submissions for completeness</li>
        <li>All actions logged in audit trail for complete accountability</li>
      </ul>
    </div>
  </div>

  <!-- Monitoring & Readiness Controls -->
  <div class="section page-break">
    <h1>Monitoring & Readiness Controls</h1>
    <p>
      The platform calculates a Jan 31 Readiness Score to proactively identify compliance gaps well ahead of filing deadlines.
    </p>
    <div class="process-box">
      <h3>Readiness Components</h3>
      <ul>
        <li><strong>W-9 Verification (60%):</strong> Tax profile status must be VERIFIED</li>
        <li><strong>Address Completeness (20%):</strong> Complete address information required</li>
        <li><strong>Stripe Payouts Enabled (10%):</strong> Payment infrastructure ready</li>
        <li><strong>Statements Available (10%):</strong> Payment history accessible</li>
      </ul>
      <p style="margin-top: 12pt;">
        Scores are calculated daily during January, with countdown mode activating Jan 1-31 to prioritize blockers.
      </p>
    </div>
  </div>

  <!-- Proactive Escalation -->
  <div class="section page-break">
    <h1>Proactive Escalation</h1>
    <p>
      Automated reminders, dashboards, and guided outreach ensure issues are resolved without last-minute risk.
    </p>
    <div class="process-box">
      <h3>Escalation Mechanisms</h3>
      <ul>
        <li><strong>Automated Reminders:</strong> Weekly emails to non-compliant contractors (max 3, 7 days apart)</li>
        <li><strong>Admin Dashboards:</strong> Real-time readiness scores and blocker identification</li>
        <li><strong>Call Lists:</strong> Prioritized daily lists of contractors requiring outreach</li>
        <li><strong>Auto-Generated Scripts:</strong> Call scripts provided to admins for consistent outreach</li>
        <li><strong>Weekly Reports:</strong> Admin email summaries during January countdown period</li>
      </ul>
    </div>
  </div>

  <!-- Archive & Lock -->
  <div class="section page-break">
    <h1>Archive & Lock</h1>
    <p>
      After January 31, records are archived and locked in read-only mode to preserve integrity and auditability.
    </p>
    <div class="process-box">
      <h3>Archive Process</h3>
      <ul>
        <li><strong>Feb 1, 12:05 AM:</strong> Automatic archive of previous tax year</li>
        <li><strong>Snapshot Creation:</strong> Final readiness score, status, and summary counts preserved</li>
        <li><strong>Record Locking:</strong> All compliance records become read-only</li>
        <li><strong>Immutable History:</strong> No modifications allowed to archived data</li>
        <li><strong>Audit Trail:</strong> Complete record of all actions preserved</li>
      </ul>
      <p style="margin-top: 12pt;">
        Archived records support 1099 form generation, IRIS export, and regulatory review while maintaining data integrity.
      </p>
    </div>
  </div>

  <!-- Summary -->
  <div class="section page-break">
    <h1>Summary</h1>
    <p>
      VelocityMaid treats tax compliance as a core operational responsibility supporting scalable and predictable growth.
    </p>
    <div class="process-box">
      <h3>Key Outcomes</h3>
      <ul>
        <li>Automated compliance workflows reduce operational overhead</li>
        <li>Proactive monitoring identifies gaps before deadlines</li>
        <li>Secure data handling protects contractor privacy</li>
        <li>Immutable archives ensure audit integrity</li>
        <li>Scalable processes support business growth</li>
      </ul>
    </div>
  </div>
</body>
</html>
    `.trim();

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="velocitymaid-compliance-process.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_1099_COMPLIANCE_PROCESS] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate compliance process PDF",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

