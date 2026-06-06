/**
 * Branded Partner Pilot Proposal PDF
 * 
 * GET /api/admin/partner-pilot-proposal.pdf
 * 
 * Generates a professional, calm, credible partner pilot proposal PDF
 * Safe for legal + ops teams, infrastructure-focused (not sales brochure)
 * 
 * Query params:
 * - partner_name: Partner organization name
 * - contact_name: Contact person name
 * - contact_email: Contact email
 * - contact_phone: Contact phone
 * 
 * Admin-only, read-only
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import {
  generateBrandedCoverPage,
  getCoverPageStyles,
  type CoverPageMeta,
} from "@/lib/reports/coverPage";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const searchParams = request.nextUrl.searchParams;
    const partnerName = searchParams.get("partner_name") || "Partner Organization";
    const contactName = searchParams.get("contact_name") || "VelocityMaid Team";
    const contactEmail = searchParams.get("contact_email") || "admin@velocitymaid.com";
    const contactPhone = searchParams.get("contact_phone") || "+1 (802) 555-1234";

    const preparedDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Partner Pilot Proposal cover page metadata (aligned spec)
    const coverMeta: CoverPageMeta = {
      logoPath: searchParams.get("logo_path") || undefined,
      title: "Partner Pilot Proposal",
      subtitle: "Compliance Infrastructure for Contractor-Based Operations",
      tagline: "Infrastructure for trust at scale.",
      date: preparedDate,
      confidentialNote: "Confidential — Partnership Evaluation",
      preparedFor: partnerName,
    };

    // Generate HTML for PDF (print-optimized, professional tone)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid - Partner Pilot Proposal</title>
  <style>
    @page {
      size: letter;
      margin: 0.75in;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #111827;
      background: #ffffff;
    }
    ${getCoverPageStyles()}
    .header {
      margin-bottom: 24pt;
      padding-bottom: 12pt;
      border-bottom: 2px solid #064E3B;
    }
    h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 8pt;
      color: #1F2937;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 8pt;
      color: #064E3B;
    }
    p {
      margin-bottom: 10pt;
      text-align: justify;
    }
    .meta {
      font-size: 9pt;
      color: #6B7280;
      margin-top: 12pt;
      line-height: 1.4;
    }
    .section {
      margin-bottom: 18pt;
    }
    .contact {
      margin-top: 24pt;
      padding-top: 12pt;
      border-top: 1px solid #d1d5db;
      font-size: 9pt;
      color: #6B7280;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  ${generateBrandedCoverPage(coverMeta)}

  <!-- Content Pages Start Here -->
  <!-- Header -->
  <div class="header">
    <h1>VelocityMaid</h1>
    <p style="font-size: 12pt; margin-bottom: 4pt;">
      <strong>Partner Pilot Proposal</strong>
    </p>
    <p style="font-size: 10pt; color: #6B7280;">
      Compliance Infrastructure Pilot (Phase 1)
    </p>
  </div>

  <!-- Meta Information -->
  <div class="meta">
    <p><strong>Prepared for:</strong> ${partnerName}</p>
    <p><strong>Prepared by:</strong> VelocityMaid</p>
    <p><strong>Date:</strong> ${preparedDate}</p>
    <p><strong>Pilot Duration:</strong> 30–60 days</p>
  </div>

  <!-- Section 1: Purpose -->
  <div class="section">
    <h2>1. Purpose</h2>
    <p>
      This pilot allows the partner organization to evaluate VelocityMaid as a
      compliance operating system for independent contractors, without disrupting
      existing payroll, payment methods, or internal workflows.
    </p>
  </div>

  <!-- Section 2: Pilot Scope -->
  <div class="section">
    <h2>2. Pilot Scope (Phase 1 Only)</h2>
    <p>
      The pilot includes secure digital W-9 collection, admin verification workflows,
      real-time compliance readiness tracking, and audit-ready documentation.
      VelocityMaid does not process payments, act as employer-of-record, or provide
      legal or tax advice during this phase.
    </p>
  </div>

  <!-- Section 3: What Remains Unchanged -->
  <div class="section">
    <h2>3. What Remains Unchanged</h2>
    <p>
      Contractors are paid exactly as they are today. Existing payroll providers,
      tax filing responsibilities, and operational workflows remain fully intact.
      VelocityMaid runs in parallel and does not replace existing systems.
    </p>
  </div>

  <!-- Section 4: Pilot Setup & Timeline -->
  <div class="section">
    <h2>4. Pilot Setup & Timeline</h2>
    <p>
      <strong>Week 1:</strong> Select pilot contractors (recommended 5–15), admin onboarding,
      and contractor invitations.
    </p>
    <p>
      <strong>Weeks 2–4:</strong> Contractors submit documentation, admins verify submissions,
      and readiness dashboards update in real time.
    </p>
    <p>
      <strong>End of Pilot:</strong> Outcome review and discussion of next steps.
    </p>
  </div>

  <!-- Section 5: Success Criteria -->
  <div class="section">
    <h2>5. Success Criteria</h2>
    <p>
      The pilot is successful if the partner confirms reduced administrative effort,
      centralized visibility into contractor readiness, audit-ready documentation,
      and minimal disruption to daily operations.
    </p>
  </div>

  <!-- Section 6: Optional Next Phases -->
  <div class="section">
    <h2>6. Optional Next Phases</h2>
    <p>
      Future phases may include payout eligibility controls, Stripe Connect onboarding,
      and expanded governance reporting. These phases are optional and discussed
      separately.
    </p>
  </div>

  <!-- Section 7: Data Protection & Governance -->
  <div class="section">
    <h2>7. Data Protection & Governance</h2>
    <p>
      Sensitive data is encrypted at rest, never transmitted via email, and protected
      by role-based access controls. Records are preserved to support audit review
      and operational transparency.
    </p>
  </div>

  <!-- Section 8: Next Steps -->
  <div class="section">
    <h2>8. Next Steps</h2>
    <p>
      Confirm pilot interest, identify the pilot contractor group, and schedule
      onboarding. VelocityMaid will adapt timelines as needed to fit operational
      requirements.
    </p>
  </div>

  <!-- Contact Information -->
  <div class="contact">
    <p><strong>Contact</strong></p>
    <p>${contactName}</p>
    <p>${contactEmail} | ${contactPhone}</p>
  </div>
</body>
</html>
    `.trim();

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="VelocityMaid_Partner_Pilot_Proposal_${partnerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
      },
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error("[ADMIN_PARTNER_PILOT_PROPOSAL] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate partner pilot proposal PDF",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

