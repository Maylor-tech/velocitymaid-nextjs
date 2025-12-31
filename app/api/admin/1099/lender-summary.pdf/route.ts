/**
 * Lender-Specific Compliance Summary PDF (Optional)
 * 
 * GET /api/admin/1099/lender-summary.pdf
 * 
 * Generates a lender-focused compliance summary emphasizing:
 * - Regulatory compliance
 * - Risk management
 * - Operational stability
 * - Financial controls
 * 
 * Read-only, admin-only
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    // Get latest archived year for key metrics
    const latestArchive = await prisma.taxYearArchive.findFirst({
      orderBy: { year: "desc" },
    });

    if (!latestArchive) {
      return NextResponse.json(
        {
          success: false,
          error: "No archived tax years found. Lender summary requires at least one archived year.",
        },
        { status: 404 }
      );
    }

    const summary = latestArchive.summaryJson as any;
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
  <title>VelocityMaid - Lender Compliance Summary</title>
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
    p {
      margin-bottom: 10pt;
    }
    ul {
      margin-left: 24pt;
      margin-bottom: 10pt;
    }
    li {
      margin-bottom: 6pt;
    }
    .compliance-box {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 12pt;
      margin: 12pt 0;
    }
    .risk-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12pt;
      margin: 12pt 0;
    }
    .control-box {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 12pt;
      margin: 12pt 0;
    }
    .page-break {
      page-break-after: always;
    }
    .section {
      margin-bottom: 24pt;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
      margin: 18pt 0;
    }
    .metric-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 12pt;
      border-radius: 4pt;
    }
    .metric-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 4pt;
    }
    .metric-value {
      font-size: 18pt;
      font-weight: bold;
      color: #1e40af;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>VelocityMaid</h1>
    <h2>Lender Compliance Summary</h2>
    <p style="margin-top: 48pt; font-size: 14pt; color: #6b7280;">
      Regulatory Compliance & Risk Management Overview
    </p>
    <p style="margin-top: 24pt;">
      <strong>Prepared:</strong> ${preparedDate}
    </p>
  </div>

  <!-- Regulatory Compliance -->
  <div class="section">
    <h1>Regulatory Compliance</h1>
    <p>
      VelocityMaid maintains full compliance with IRS 1099 reporting requirements for independent contractor payments. The platform implements automated, auditable controls to ensure timely and accurate tax reporting.
    </p>
    <div class="compliance-box">
      <h2>IRS 1099 Requirements</h2>
      <ul>
        <li><strong>Threshold Compliance:</strong> Tracks and reports all contractors meeting $600.01 threshold (2025) or $2,000.01 threshold (2026+)</li>
        <li><strong>W-9 Collection:</strong> Automated collection and verification of contractor tax information</li>
        <li><strong>Filing Deadline:</strong> All compliance actions completed by Jan 31 deadline</li>
        <li><strong>Record Keeping:</strong> Complete audit trail preserved for regulatory review</li>
        <li><strong>IRIS Compatibility:</strong> Export format compatible with IRS e-filing system</li>
      </ul>
    </div>
  </div>

  <!-- Risk Management -->
  <div class="section page-break">
    <h1>Risk Management</h1>
    <div class="metric-grid">
      <div class="metric-item">
        <div class="metric-label">Latest Year Readiness</div>
        <div class="metric-value">${latestArchive.readinessScore.toFixed(0)}%</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Status</div>
        <div class="metric-value">${latestArchive.status.replace("_", " ")}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Eligible Contractors</div>
        <div class="metric-value">${summary?.eligibleCleaners || 0}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Verified W-9</div>
        <div class="metric-value">${summary?.verifiedW9 || 0}</div>
      </div>
    </div>
    <div class="risk-box">
      <h2>Controlled Risks</h2>
      <ul>
        <li><strong>Late Filing Risk:</strong> Mitigated through automated reminders and proactive outreach</li>
        <li><strong>Data Exposure Risk:</strong> Controlled via encryption and access controls</li>
        <li><strong>Operational Risk:</strong> Reduced through automation and process maturity</li>
        <li><strong>Compliance Risk:</strong> Managed via deadline-based locking and audit trails</li>
      </ul>
    </div>
  </div>

  <!-- Financial Controls -->
  <div class="section page-break">
    <h1>Financial Controls</h1>
    <div class="control-box">
      <h2>Payment Record Integrity</h2>
      <ul>
        <li>All contractor payments tracked in immutable ledger</li>
        <li>Year-end totals calculated from locked, archived records</li>
        <li>No post-deadline modifications to payment history</li>
        <li>Complete audit trail for all financial transactions</li>
      </ul>
    </div>
    <div class="control-box">
      <h2>Data Protection</h2>
      <ul>
        <li>Tax identifiers encrypted at rest (AES-256-GCM)</li>
        <li>Role-based access controls limit data exposure</li>
        <li>No sensitive data in emails or public exports</li>
        <li>Secure key management and rotation capabilities</li>
      </ul>
    </div>
  </div>

  <!-- Operational Stability -->
  <div class="section page-break">
    <h1>Operational Stability</h1>
    <p>
      Compliance processes are designed to scale with business growth without proportional increases in operational overhead or risk.
    </p>
    <div class="compliance-box">
      <h2>Scalability Features</h2>
      <ul>
        <li><strong>Automated Systems:</strong> Compliance workflows handled by automated systems, not manual processes</li>
        <li><strong>Linear Scaling:</strong> Process efficiency improves with scale, not degrades</li>
        <li><strong>Proactive Management:</strong> Early identification and resolution of compliance gaps</li>
        <li><strong>Process Maturity:</strong> Year-over-year improvement in readiness scores</li>
      </ul>
    </div>
    <div class="compliance-box">
      <h2>Business Continuity</h2>
      <ul>
        <li>Automated backup and recovery procedures</li>
        <li>Immutable archive records ensure data integrity</li>
        <li>Read-only access to historical records prevents accidental modification</li>
        <li>Complete audit trail supports regulatory review and dispute resolution</li>
      </ul>
    </div>
  </div>

  <!-- Governance -->
  <div class="section">
    <h1>Governance & Oversight</h1>
    <ul>
      <li><strong>Role-Based Access:</strong> Admin controls limit system access to authorized personnel</li>
      <li><strong>Audit Logging:</strong> All sensitive operations logged with timestamps and actor identification</li>
      <li><strong>Archive Locking:</strong> Year-end records locked after deadline to prevent modification</li>
      <li><strong>Independent Review:</strong> Records available for accountant and regulatory review</li>
      <li><strong>Documentation:</strong> Complete process documentation available for due diligence</li>
    </ul>
  </div>
</body>
</html>
    `.trim();

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="velocitymaid-lender-compliance-summary.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_1099_LENDER_SUMMARY] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate lender summary",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


