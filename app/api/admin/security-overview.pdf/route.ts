/**
 * Security & Data Protection Overview PDF
 * 
 * GET /api/admin/security-overview.pdf
 * 
 * Documents security controls, data protection measures, and compliance safeguards
 * Suitable for security audits, partner due diligence, and regulatory reviews
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
  <title>VelocityMaid - Security & Data Protection Overview</title>
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
    .security-box {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 12pt;
      margin: 12pt 0;
    }
    .control-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4pt;
      padding: 12pt;
      margin: 8pt 0;
    }
    .control-item h4 {
      margin: 0 0 6pt 0;
      color: #1e40af;
      font-size: 12pt;
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
    .page-break {
      page-break-after: always;
    }
    .section {
      margin-bottom: 24pt;
    }
    .checklist {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 12pt;
      margin: 12pt 0;
    }
    .checklist ul {
      list-style: none;
      margin-left: 0;
    }
    .checklist li:before {
      content: "🔒 ";
      margin-right: 8pt;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>VelocityMaid</h1>
    <h2>Security & Data Protection Overview</h2>
    <p style="margin-top: 48pt; font-size: 14pt; color: #6b7280;">
      Technical Controls, Encryption, and Compliance Safeguards
    </p>
    <p style="margin-top: 24pt;">
      <strong>Prepared:</strong> ${preparedDate}
    </p>
  </div>

  <!-- Security Philosophy -->
  <div class="section">
    <h1>Security Philosophy</h1>
    <p>
      VelocityMaid treats personal and financial data as a stewardship responsibility.
    </p>
    <div class="security-box">
      <h2>Core Principles</h2>
      <ul>
        <li>Data protection is embedded by design, not added as an afterthought</li>
        <li>Security controls support trust, compliance, and scalable growth</li>
        <li>Transparency in security practices builds confidence with stakeholders</li>
        <li>Continuous improvement based on industry best practices</li>
      </ul>
    </div>
  </div>

  <!-- Data Classification -->
  <div class="section page-break">
    <h1>Data Classification</h1>
    <p>
      Sensitive identifiers are classified and handled separately from operational data.
    </p>
    <div class="security-box">
      <h2>Data Categories</h2>
      <ul>
        <li><strong>Highly Sensitive:</strong> Tax Identification Numbers (TINs) - encrypted at rest</li>
        <li><strong>Sensitive:</strong> Payment amounts, addresses - protected via access controls</li>
        <li><strong>Operational:</strong> Contractor names, email addresses - standard protection</li>
        <li><strong>Public:</strong> Service descriptions, general platform information</li>
      </ul>
      <p style="margin-top: 12pt;">
        Each category has appropriate security controls based on sensitivity level and regulatory requirements.
      </p>
    </div>
  </div>

  <!-- Encryption & Storage -->
  <div class="section page-break">
    <h1>Encryption & Storage</h1>
    <p>
      Sensitive tax identifiers are encrypted at rest. Plain-text identifiers are never stored or displayed.
    </p>
    <div class="security-box">
      <h2>Encryption Standards</h2>
      <ul>
        <li><strong>Algorithm:</strong> AES-256-GCM (Advanced Encryption Standard, 256-bit key, Galois/Counter Mode)</li>
        <li><strong>Key Management:</strong> Environment-based keys with versioning support for rotation</li>
        <li><strong>Storage:</strong> Encrypted TIN stored in database, key version tracked separately</li>
        <li><strong>Display:</strong> Only last 4 digits shown in plaintext for verification purposes</li>
      </ul>
    </div>
    <div class="security-box">
      <h2>Data Masking</h2>
      <p>Full TIN never exposed in:</p>
      <ul>
        <li>API responses (redacted or encrypted)</li>
        <li>Email communications (never included)</li>
        <li>CSV exports (last 4 digits only, or blank for IRIS)</li>
        <li>PDF reports (no TINs included)</li>
        <li>Admin UI displays (masked or last 4 only)</li>
      </ul>
    </div>
  </div>

  <!-- Access Controls -->
  <div class="section page-break">
    <h1>Access Controls</h1>
    <p>
      Role-based permissions ensure that users can only access information necessary for their role.
    </p>
    <div class="security-box">
      <h2>Role-Based Access</h2>
      <ul>
        <li><strong>Cleaner:</strong> Self-service only, own data, no TIN viewing</li>
        <li><strong>Admin:</strong> Full operational access, TIN decryption for verification only</li>
        <li><strong>Super-Admin:</strong> Full system access, override capabilities for edge cases</li>
      </ul>
    </div>
    <div class="security-box">
      <h2>Authentication & Session Management</h2>
      <ul>
        <li>Secure session tokens with expiration</li>
        <li>HTTPS-only cookie transmission</li>
        <li>Role verification on all sensitive endpoints</li>
        <li>Admin routes protected by middleware</li>
        <li>Audit logging of all access events</li>
      </ul>
    </div>
  </div>

  <!-- Communications Safeguards -->
  <div class="section page-break">
    <h1>Communications Safeguards</h1>
    <p>
      No sensitive personal data is transmitted via email or routine exports.
    </p>
    <div class="security-box">
      <h2>Email Communications</h2>
      <ul>
        <li>No TINs included in any email communications</li>
        <li>Payment confirmations include amounts and dates only</li>
        <li>W-9 reminders link to secure portal, never include forms</li>
        <li>All emails transmitted over TLS</li>
      </ul>
    </div>
    <div class="security-box">
      <h2>Export Controls</h2>
      <ul>
        <li>CSV exports redacted (last 4 digits only, or blank for IRIS)</li>
        <li>PDF reports contain no sensitive identifiers</li>
        <li>Admin-only access to export endpoints</li>
        <li>Audit trail of all export downloads</li>
      </ul>
    </div>
  </div>

  <!-- Auditability -->
  <div class="section page-break">
    <h1>Auditability</h1>
    <p>
      Immutable year-end archives and logged administrative actions support governance and audit review.
    </p>
    <div class="security-box">
      <h2>Audit Trail</h2>
      <ul>
        <li><strong>Tax Profile Actions:</strong> Draft, submit, verify, reject (with admin ID and timestamp)</li>
        <li><strong>Admin Actions:</strong> Batch creation, approval, processing (all logged)</li>
        <li><strong>Data Access:</strong> TIN decryption events, export downloads (tracked)</li>
        <li><strong>System Events:</strong> Archive creation, cron job execution (logged)</li>
      </ul>
    </div>
    <div class="security-box">
      <h2>Immutable Archives</h2>
      <ul>
        <li>Year-end records locked after Jan 31 deadline</li>
        <li>No modifications allowed to archived data</li>
        <li>Complete snapshots preserved for audit review</li>
        <li>Read-only access ensures data integrity</li>
      </ul>
    </div>
  </div>

  <!-- Data Retention & Locking -->
  <div class="section page-break">
    <h1>Data Retention & Locking</h1>
    <p>
      Records are locked after deadlines to prevent retroactive modification.
    </p>
    <div class="security-box">
      <h2>Retention Policy</h2>
      <ul>
        <li>Tax records retained per regulatory requirements (typically 7 years)</li>
        <li>Archived years locked and immutable after Jan 31</li>
        <li>Audit logs preserved for compliance review</li>
        <li>Backup retention aligned with regulatory requirements</li>
      </ul>
    </div>
    <div class="security-box">
      <h2>Locking Mechanism</h2>
      <ul>
        <li>Automatic archive on Feb 1 at 12:05 AM</li>
        <li>All compliance records become read-only</li>
        <li>No modifications allowed to archived data</li>
        <li>Exports generated from immutable snapshots</li>
        <li>Super-admin override available only for exceptional cases</li>
      </ul>
    </div>
  </div>

  <!-- Summary -->
  <div class="section">
    <h1>Summary</h1>
    <p>
      Security controls are embedded by design to support trust, compliance, and scalable growth.
    </p>
    <div class="security-box">
      <h2>Key Outcomes</h2>
      <ul>
        <li>Sensitive data protected through encryption and access controls</li>
        <li>No data exposure in communications or routine exports</li>
        <li>Complete audit trail supports governance and compliance</li>
        <li>Immutable archives ensure data integrity for regulatory review</li>
        <li>Security practices align with industry best practices and regulatory expectations</li>
      </ul>
    </div>
  </div>
</body>
</html>
    `.trim();

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="velocitymaid-security-overview.pdf"`,
      },
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error("[ADMIN_SECURITY_OVERVIEW] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate security overview PDF",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

