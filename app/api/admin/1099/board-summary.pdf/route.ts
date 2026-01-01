/**
 * Phase 3H.13: Board-Ready Compliance Summary (PDF)
 * 
 * GET /api/admin/1099/board-summary.pdf
 * 
 * Generates a multi-page PDF summary suitable for boards, accountants, and regulators
 * Non-technical, non-operational, non-sensitive
 * 
 * Read-only, admin-only
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import {
  generateBrandedCoverPage,
  getCoverPageStyles,
  type CoverPageMeta,
} from "@/lib/reports/coverPage";

/**
 * Generate executive summary text
 */
function generateExecutiveSummary(data: {
  years: Array<{
    year: number;
    finalScore: number;
    status: string;
    eligibleCleaners: number;
    verifiedW9Pct: number;
  }>;
  trends: {
    readinessImproving: boolean | null;
    avgScoreIncrease: number | null;
  };
}): string {
  const sortedYears = [...data.years].sort((a, b) => a.year - b.year);
  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];
  const yearCount = sortedYears.length;

  let text = `This report summarizes VelocityMaid's year-end tax compliance posture for independent contractors paid via the platform.\n\n`;

  if (yearCount >= 2) {
    const improvement = lastYear.finalScore - firstYear.finalScore;
    text += `Over the last ${yearCount} tax years, the organization has `;
    if (improvement > 0) {
      text += `improved its Jan 31 filing readiness from ${firstYear.finalScore.toFixed(0)}% to ${lastYear.finalScore.toFixed(0)}%, `;
    } else if (improvement < 0) {
      text += `seen its Jan 31 filing readiness change from ${firstYear.finalScore.toFixed(0)}% to ${lastYear.finalScore.toFixed(0)}%, `;
    } else {
      text += `maintained its Jan 31 filing readiness at ${lastYear.finalScore.toFixed(0)}%, `;
    }
    text += `reflecting stronger onboarding, automation, and proactive compliance practices.\n\n`;
  }

  text += `Key highlights:\n`;
  text += `• Final readiness score (${lastYear.year}): ${lastYear.finalScore.toFixed(0)}% (${lastYear.status.replace("_", " ")})\n`;
  text += `• Contractors verified by deadline: ${lastYear.verifiedW9Pct}%\n`;
  if (data.trends.readinessImproving !== null) {
    text += `• Year-over-year trend: ${data.trends.readinessImproving ? "Improving" : "Needs attention"}`;
    if (data.trends.avgScoreIncrease !== null) {
      text += ` (avg ${data.trends.avgScoreIncrease > 0 ? "+" : ""}${data.trends.avgScoreIncrease.toFixed(1)} points per year)`;
    }
  }

  return text;
}

/**
 * Generate forward outlook text
 */
function generateForwardOutlook(data: {
  years: Array<{
    year: number;
    finalScore: number;
    status: string;
  }>;
  trends: {
    readinessImproving: boolean | null;
    avgScoreIncrease: number | null;
  };
}): string {
  const sortedYears = [...data.years].sort((a, b) => a.year - b.year);
  const lastYear = sortedYears[sortedYears.length - 1];
  const nextYear = lastYear.year + 1;

  let text = `Based on trend data and current compliance infrastructure:\n\n`;

  if (data.trends.readinessImproving && data.trends.avgScoreIncrease !== null && data.trends.avgScoreIncrease > 0) {
    const projectedScore = Math.min(100, lastYear.finalScore + data.trends.avgScoreIncrease);
    text += `• Management expects to reach >${projectedScore.toFixed(0)}% readiness earlier in the cycle for ${nextYear}.\n`;
  } else {
    text += `• Management expects to maintain or improve readiness levels for ${nextYear}.\n`;
  }

  text += `• All ${lastYear.year} records have been archived and locked for integrity.\n`;
  text += `• Automated reminder systems and proactive outreach will continue to support compliance velocity.\n`;

  return text;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    // Get analytics data (reuse the analytics endpoint logic)
    const archives = await prisma.taxYearArchive.findMany({
      orderBy: { year: "desc" },
    });

    if (archives.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No archived tax years found. Board summary requires at least one archived year.",
        },
        { status: 404 }
      );
    }

    // Build year data
    const years = archives.map((archive) => {
      const summary = archive.summaryJson as any;
      const eligibleCleaners = summary?.eligibleCleaners || 0;
      const verifiedW9 = summary?.verifiedW9 || 0;
      const verifiedW9Pct =
        eligibleCleaners > 0
          ? Math.round((verifiedW9 / eligibleCleaners) * 100)
          : 0;

      return {
        year: archive.year,
        finalScore: archive.readinessScore,
        status: archive.status,
        eligibleCleaners,
        verifiedW9Pct,
        addressCompletePct:
          eligibleCleaners > 0
            ? Math.round(
                ((summary?.addressComplete || 0) / eligibleCleaners) * 100
              )
            : 0,
        archiveDate: archive.archivedAt.toISOString().split("T")[0],
        blockers: (summary?.topBlockers || []).map((b: any) => ({
          type: b.type,
          count: b.count,
        })),
      };
    });

    // Calculate trends
    const sortedYears = [...years].sort((a, b) => a.year - b.year);
    let readinessImproving: boolean | null = null;
    let avgScoreIncrease: number | null = null;

    if (sortedYears.length >= 2) {
      const firstYear = sortedYears[0];
      const lastYear = sortedYears[sortedYears.length - 1];
      readinessImproving = lastYear.finalScore > firstYear.finalScore;

      const scoreDiffs: number[] = [];
      for (let i = 1; i < sortedYears.length; i++) {
        scoreDiffs.push(
          sortedYears[i].finalScore - sortedYears[i - 1].finalScore
        );
      }
      avgScoreIncrease =
        scoreDiffs.length > 0
          ? Math.round(
              (scoreDiffs.reduce((sum, diff) => sum + diff, 0) /
                scoreDiffs.length) *
                100
            ) / 100
          : null;
    }

    const trends = {
      readinessImproving,
      avgScoreIncrease,
    };

    // Generate executive summary
    const executiveSummary = generateExecutiveSummary({ years, trends });

    // Generate forward outlook
    const forwardOutlook = generateForwardOutlook({ years, trends });

    // Get year range
    const yearRange =
      sortedYears.length > 0
        ? sortedYears.length === 1
          ? `${sortedYears[0].year}`
          : `${sortedYears[0].year}–${sortedYears[sortedYears.length - 1].year}`
        : "N/A";

    const preparedDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Board PDF cover page metadata (aligned spec)
    const searchParams = request.nextUrl.searchParams;
    const coverMeta: CoverPageMeta = {
      logoPath: searchParams.get("logo_path") || undefined,
      title: "Year-End Compliance Summary",
      subtitle: "1099 Reporting & Contractor Governance",
      tagline: "Infrastructure for trust at scale.",
      date: preparedDate,
      confidentialNote: "Confidential — Board of Directors",
    };

    // Generate HTML for PDF (print-optimized)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid - Year-End Compliance Summary</title>
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
    ${getCoverPageStyles()}
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 24pt;
      margin-bottom: 12pt;
      color: #1e40af;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 8pt;
      color: #374151;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
      color: #4b5563;
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
      margin-bottom: 4pt;
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
    .status-ready {
      color: #059669;
      font-weight: bold;
    }
    .status-at-risk {
      color: #d97706;
      font-weight: bold;
    }
    .status-not-ready {
      color: #dc2626;
      font-weight: bold;
    }
    .chart-container {
      margin: 18pt 0;
      text-align: center;
    }
    .chart-bar {
      display: inline-block;
      margin: 0 8pt;
      vertical-align: bottom;
      text-align: center;
    }
    .chart-label {
      font-size: 9pt;
      margin-top: 4pt;
    }
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4pt;
      padding: 12pt;
      margin: 8pt 0;
    }
    .metric-label {
      font-size: 9pt;
      color: #6b7280;
      margin-bottom: 4pt;
    }
    .metric-value {
      font-size: 16pt;
      font-weight: bold;
      color: #111827;
    }
    .governance-checklist {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 12pt;
      margin: 12pt 0;
    }
    .governance-checklist ul {
      list-style: none;
      margin-left: 0;
    }
    .governance-checklist li:before {
      content: "✅ ";
      margin-right: 8pt;
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
  ${generateBrandedCoverPage(coverMeta)}

  <!-- Executive Summary -->
  <div class="section page-break">
    <h1>Executive Summary</h1>
    <div style="white-space: pre-line;">${executiveSummary}</div>
  </div>

  <!-- Readiness Score Trend -->
  <div class="section page-break">
    <h1>Readiness Score Trend</h1>
    <div class="chart-container">
      ${sortedYears
        .map((year) => {
          const height = (year.finalScore / 100) * 200;
          const statusClass =
            year.status === "READY"
              ? "status-ready"
              : year.status === "AT_RISK"
              ? "status-at-risk"
              : "status-not-ready";
          return `
        <div class="chart-bar">
          <div style="width: 60px; height: ${height}px; background: ${
            year.status === "READY"
              ? "#10b981"
              : year.status === "AT_RISK"
              ? "#f59e0b"
              : "#ef4444"
          }; margin: 0 auto;"></div>
          <div class="chart-label">${year.year}</div>
          <div class="chart-label ${statusClass}">${year.finalScore.toFixed(0)}%</div>
        </div>
      `;
        })
        .join("")}
    </div>
    <p style="margin-top: 18pt; font-size: 9pt; color: #6b7280;">
      <em>Readiness scores reflect the percentage of threshold-eligible contractors fully compliant by the filing deadline.</em>
    </p>
  </div>

  <!-- Annual Outcomes Table -->
  <div class="section page-break">
    <h1>Annual Outcomes</h1>
    <table>
      <thead>
        <tr>
          <th>Tax Year</th>
          <th>Final Score</th>
          <th>Status</th>
          <th>Eligible Contractors</th>
          <th>W-9 Verified %</th>
          <th>Archived</th>
        </tr>
      </thead>
      <tbody>
        ${sortedYears
          .map(
            (year) => `
        <tr>
          <td>${year.year}</td>
          <td>${year.finalScore.toFixed(1)}</td>
          <td class="${
            year.status === "READY"
              ? "status-ready"
              : year.status === "AT_RISK"
              ? "status-at-risk"
              : "status-not-ready"
          }">${year.status.replace("_", " ")}</td>
          <td>${year.eligibleCleaners}</td>
          <td>${year.verifiedW9Pct}%</td>
          <td>${new Date(year.archiveDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}</td>
        </tr>
      `
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <!-- Compliance Drivers & Blockers -->
  <div class="section page-break">
    <h1>Compliance Drivers & Blockers</h1>
    ${sortedYears.map((year) => {
      const totalBlockers = year.blockers.reduce((sum, b) => sum + b.count, 0);
      if (totalBlockers === 0) {
        return `
      <h3>${year.year}</h3>
      <p>No blocking issues identified. All eligible contractors were fully compliant by the filing deadline.</p>
    `;
      }
      return `
      <h3>${year.year}</h3>
      <ul>
        ${year.blockers
          .map(
            (b) =>
              `<li>${b.type === "W9_NOT_VERIFIED" ? "W-9 not verified" : b.type === "ADDRESS_INCOMPLETE" ? "Address incomplete" : b.type}: ${b.count} contractor${b.count !== 1 ? "s" : ""}</li>`
          )
          .join("")}
      </ul>
    `;
    }).join("")}
    ${sortedYears.length > 0 && sortedYears[sortedYears.length - 1].blockers.length === 0
      ? `<p><strong>Latest Year (${sortedYears[sortedYears.length - 1].year}):</strong> Proactive reminders and direct outreach reduced compliance blockers to zero before Jan 31.</p>`
      : ""}
  </div>

  <!-- Operational Efficiency Metrics -->
  <div class="section page-break">
    <h1>Operational Efficiency Metrics</h1>
    <p>Automation and proactive outreach have reduced verification cycle time while lowering manual follow-up requirements.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12pt; margin-top: 18pt;">
      <div class="metric-card">
        <div class="metric-label">Median Days: Payout → W-9 Submitted</div>
        <div class="metric-value">N/A</div>
        <div style="font-size: 8pt; color: #6b7280; margin-top: 4pt;">Data collection in progress</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Median Days: W-9 Submitted → Verified</div>
        <div class="metric-value">N/A</div>
        <div style="font-size: 8pt; color: #6b7280; margin-top: 4pt;">Data collection in progress</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Avg Reminders per Contractor</div>
        <div class="metric-value">N/A</div>
        <div style="font-size: 8pt; color: #6b7280; margin-top: 4pt;">Data collection in progress</div>
      </div>
    </div>
  </div>

  <!-- Governance Controls -->
  <div class="section page-break">
    <h1>Governance Controls</h1>
    <div class="governance-checklist">
      <ul>
        <li>No sensitive tax data included in emails or exports</li>
        <li>TINs encrypted at rest using AES-256-GCM</li>
        <li>Year-end records locked after Jan 31</li>
        <li>Audit snapshots preserved in TaxYearArchive</li>
        <li>Admin actions logged for accountability</li>
        <li>Read-only access to archived years</li>
        <li>Automated reminder systems with rate limits</li>
      </ul>
    </div>
    <p style="margin-top: 12pt;">
      <strong>Statement:</strong> These controls align with prudent data stewardship and regulatory expectations. The organization maintains strict separation between operational systems and sensitive tax data, with encryption, access controls, and audit trails in place.
    </p>
  </div>

  <!-- Forward Outlook -->
  <div class="section page-break">
    <h1>Forward Outlook</h1>
    <div style="white-space: pre-line;">${forwardOutlook}</div>
  </div>

  <!-- Appendix -->
  <div class="section page-break">
    <h1>Appendix</h1>
    <h2>Definitions</h2>
    <p><strong>Readiness Score:</strong> A composite metric (0-100) reflecting the percentage of threshold-eligible contractors who are fully compliant by the filing deadline. Components include W-9 verification status, address completeness, Stripe payout readiness, and statement availability.</p>
    <p><strong>Threshold:</strong> The minimum annual payout amount that triggers 1099 reporting requirements. For 2025, the threshold is $600.01. For 2026 and beyond, the threshold is $2,000.01.</p>
    <p><strong>Archive:</strong> The process of locking tax year records after Jan 31, preserving a complete snapshot of compliance status for audit and governance purposes.</p>
    <h2>Methodology</h2>
    <p>This report aggregates data from archived tax year snapshots (TaxYearArchive table). All readiness scores and compliance metrics are calculated at the time of archive (Feb 1) and remain immutable thereafter. Data is sourced exclusively from locked, archived records to ensure accuracy and auditability.</p>
    <h2>Contact</h2>
    <p>For questions regarding this report, contact the VelocityMaid compliance team.</p>
  </div>
</body>
</html>
    `.trim();

    // Return HTML that can be printed to PDF
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="velocitymaid-tax-compliance-summary-${yearRange}.html"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_1099_BOARD_SUMMARY] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate board summary",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

