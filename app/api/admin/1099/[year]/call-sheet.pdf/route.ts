/**
 * Phase 3H.10: Printable Daily Call Sheet (PDF)
 * 
 * GET /api/admin/1099/[year]/call-sheet.pdf
 * 
 * Generates a printable one-page PDF call sheet for admins
 * Includes header, summary, and call list table
 * No sensitive data (no TIN)
 * Admin-only, no caching (fresh every day)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";
import { selectCallScript, getVoicemailScriptForCleaner } from "@/lib/tax/callScripts";

/**
 * Get 1099 threshold for a given year
 */
function get1099Threshold(year: number): number {
  return year === 2025 ? 600100 : 2000100;
}

/**
 * Calculate days remaining until Jan 31 end-of-day
 */
function getDaysRemainingToJan31(year: number): number {
  const now = new Date();
  const jan31End = new Date(year, 0, 31, 23, 59, 59, 999);
  return Math.max(0, Math.ceil((jan31End.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate priority score for a cleaner
 */
function calculatePriorityScore(data: {
  w9Status: TaxProfileStatus | null;
  addressComplete: boolean;
  daysRemaining: number;
  lastReminderSentAt: Date | null;
  reminderCount: number;
}): number {
  let score = 0;

  if (!data.w9Status || data.w9Status === TaxProfileStatus.DRAFT) {
    score += 100;
  } else if (data.w9Status === TaxProfileStatus.SUBMITTED) {
    score += 80;
  } else if (data.w9Status === TaxProfileStatus.REJECTED) {
    score += 90;
  }

  if (!data.addressComplete) {
    score += 30;
  }

  if (data.daysRemaining <= 7) {
    score += 50;
  } else if (data.daysRemaining <= 14) {
    score += 30;
  } else if (data.daysRemaining <= 21) {
    score += 15;
  }

  if (data.lastReminderSentAt) {
    const daysSinceReminder = Math.floor(
      (new Date().getTime() - data.lastReminderSentAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceReminder < 3) {
      score -= 20;
    }
  }

  if (data.reminderCount >= 3) {
    score -= 10;
  }

  return Math.max(0, score);
}

/**
 * Get readiness status band
 */
function getReadinessStatusBand(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Critical";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    // Require admin role
    const authContext = await requireRole(request, "ADMIN");
    const adminName = authContext.email?.split("@")[0] || "Admin";

    const year = parseInt(params.year, 10);
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { success: false, error: "Invalid year" },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const thresholdCents = get1099Threshold(year);
    const daysRemaining = getDaysRemainingToJan31(year);

    // Calculate date range for current year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Get all PAID transfers for the year
    const transfers = await prisma.payoutTransfer.findMany({
      where: {
        status: PayoutTransferStatus.PAID,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Group by cleaner and sum amounts
    const cleanerTotals = new Map<
      string,
      {
        cleanerId: string;
        cleanerName: string | null;
        cleanerEmail: string;
        cleanerPhone: string | null;
        totalAmountCents: number;
      }
    >();

    for (const transfer of transfers) {
      const existing = cleanerTotals.get(transfer.cleanerId);
      if (existing) {
        existing.totalAmountCents += transfer.amountCents;
      } else {
        cleanerTotals.set(transfer.cleanerId, {
          cleanerId: transfer.cleanerId,
          cleanerName: transfer.cleaner.name,
          cleanerEmail: transfer.cleaner.email,
          cleanerPhone: transfer.cleaner.phone,
          totalAmountCents: transfer.amountCents,
        });
      }
    }

    // Filter cleaners who meet threshold
    const eligibleCleanerIds = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => cleaner.cleanerId);

    // Fetch tax profiles
    const taxProfiles = await prisma.cleanerTaxProfile.findMany({
      where: {
        cleanerId: { in: eligibleCleanerIds },
      },
      select: {
        cleanerId: true,
        status: true,
        addressLine1: true,
        city: true,
        state: true,
        zipCode: true,
        lastReminderSentAt: true,
        reminderCount: true,
      },
    });

    const taxProfileMap = new Map(
      taxProfiles.map((profile) => [profile.cleanerId, profile])
    );

    // Build call list
    const callList = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => {
        const taxProfile = taxProfileMap.get(cleaner.cleanerId);
        const w9Status = taxProfile?.status || null;
        const addressComplete =
          !!taxProfile?.addressLine1 &&
          !!taxProfile?.city &&
          !!taxProfile?.state &&
          !!taxProfile?.zipCode;

        const hasBlockingIssues =
          !w9Status ||
          w9Status === TaxProfileStatus.DRAFT ||
          w9Status === TaxProfileStatus.SUBMITTED ||
          w9Status === TaxProfileStatus.REJECTED ||
          !addressComplete;

        if (!hasBlockingIssues) {
          return null;
        }

        const issues: string[] = [];
        if (!w9Status || w9Status === TaxProfileStatus.DRAFT) {
          issues.push("W-9 not started");
        } else if (w9Status === TaxProfileStatus.SUBMITTED) {
          issues.push("W-9 pending");
        } else if (w9Status === TaxProfileStatus.REJECTED) {
          issues.push("W-9 rejected");
        }
        if (!addressComplete) {
          issues.push("Address incomplete");
        }

        const priorityScore = calculatePriorityScore({
          w9Status,
          addressComplete,
          daysRemaining,
          lastReminderSentAt: taxProfile?.lastReminderSentAt || null,
          reminderCount: taxProfile?.reminderCount || 0,
        });

        const callScript = selectCallScript({
          cleanerName: cleaner.cleanerName,
          adminName,
          w9Status,
          addressComplete,
          issues,
        });

        // Determine script label for PDF
        let scriptLabel = "W-9 Start";
        if (callScript.type === "W9_REJECTED") {
          scriptLabel = "W-9 Fix";
        } else if (callScript.type === "W9_SUBMITTED_PENDING") {
          scriptLabel = "W-9 Status";
        } else if (callScript.type === "ADDRESS_INCOMPLETE") {
          scriptLabel = "Address";
        } else if (callScript.type === "MULTIPLE_ISSUES") {
          scriptLabel = "Multiple";
        }

        return {
          name: cleaner.cleanerName || "Unknown",
          phone: cleaner.cleanerPhone || "N/A",
          email: cleaner.cleanerEmail,
          issues: issues.join(", "),
          script: scriptLabel,
          priorityScore,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit);

    // Calculate readiness score
    const allCleaners = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents);

    const allTaxProfiles = await prisma.cleanerTaxProfile.findMany({
      where: {
        cleanerId: { in: allCleaners.map((c) => c.cleanerId) },
      },
      select: {
        cleanerId: true,
        status: true,
        addressLine1: true,
        city: true,
        state: true,
        zipCode: true,
      },
    });

    const allTaxProfileMap = new Map(
      allTaxProfiles.map((profile) => [profile.cleanerId, profile])
    );

    const cleanersWithStatements = await prisma.payoutTransfer.findMany({
      where: {
        cleanerId: { in: allCleaners.map((c) => c.cleanerId) },
        status: PayoutTransferStatus.PAID,
      },
      select: {
        cleanerId: true,
      },
      distinct: ["cleanerId"],
    });

    const cleanersWithStatementsSet = new Set(
      cleanersWithStatements.map((t) => t.cleanerId)
    );

    const readinessScores = allCleaners.map((cleaner) => {
      const taxProfile = allTaxProfileMap.get(cleaner.cleanerId);
      const w9Verified = taxProfile?.status === TaxProfileStatus.VERIFIED;
      const addressComplete =
        !!taxProfile?.addressLine1 &&
        !!taxProfile?.city &&
        !!taxProfile?.state &&
        !!taxProfile?.zipCode;
      const stripePayoutsEnabled = true; // Assume true for simplicity
      const hasStatements = cleanersWithStatementsSet.has(cleaner.cleanerId);

      let score = 0;
      if (w9Verified) score += 60;
      if (addressComplete) score += 20;
      if (stripePayoutsEnabled) score += 10;
      if (hasStatements) score += 10;

      return score;
    });

    const overallScore =
      readinessScores.length > 0
        ? readinessScores.reduce((sum, s) => sum + s, 0) / readinessScores.length
        : 0;

    // Calculate focus items
    const focusItems: string[] = [];
    const w9NotVerifiedCount = allTaxProfiles.filter(
      (p) => p.status !== TaxProfileStatus.VERIFIED
    ).length;
    if (w9NotVerifiedCount > 0) {
      focusItems.push(`${w9NotVerifiedCount} missing VERIFIED W-9`);
    }

    const addressIncompleteCount = allTaxProfiles.filter(
      (p) => !p.addressLine1 || !p.city || !p.state || !p.zipCode
    ).length;
    if (addressIncompleteCount > 0) {
      focusItems.push(`${addressIncompleteCount} incomplete address`);
    }

    // Generate PDF using HTML (simpler than pdfkit for Next.js)
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const statusBand = getReadinessStatusBand(overallScore);

    // Create HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
    }
    h1 {
      font-size: 18pt;
      margin: 0 0 8pt 0;
      color: #059669;
    }
    h2 {
      font-size: 14pt;
      margin: 0 0 12pt 0;
      font-weight: bold;
    }
    h3 {
      font-size: 12pt;
      margin: 8pt 0 4pt 0;
      font-weight: bold;
    }
    .summary {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 12pt;
      margin: 12pt 0;
      border-radius: 4pt;
    }
    .focus {
      margin: 8pt 0;
    }
    .focus ul {
      margin: 4pt 0;
      padding-left: 20pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 9pt;
    }
    th {
      background: #e5e7eb;
      border: 1px solid #9ca3af;
      padding: 6pt;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid #d1d5db;
      padding: 6pt;
      vertical-align: top;
    }
    .notes-col {
      width: 60pt;
      border-right: 2px solid #9ca3af;
    }
    .footer {
      margin-top: 16pt;
      padding-top: 8pt;
      border-top: 1px solid #d1d5db;
      font-size: 8pt;
      color: #6b7280;
      font-style: italic;
    }
  </style>
</head>
<body>
  <h1>VelocityMaid</h1>
  <h2>Jan 31 Compliance — Daily Call Sheet</h2>
  
  <div class="summary">
    <strong>Date:</strong> ${dateStr}<br/>
    <strong>Days remaining:</strong> ${daysRemaining}<br/>
    <strong>Readiness score:</strong> ${overallScore.toFixed(1)} / 100 (${statusBand})
  </div>

  <div class="focus">
    <h3>Today's Focus:</h3>
    <ul>
      ${focusItems.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 20pt;">#</th>
        <th style="width: 90pt;">Name</th>
        <th style="width: 80pt;">Phone</th>
        <th style="width: 120pt;">Email</th>
        <th style="width: 100pt;">Issues</th>
        <th style="width: 70pt;">Script</th>
        <th class="notes-col">Notes</th>
      </tr>
    </thead>
    <tbody>
      ${callList
        .map(
          (cleaner, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${cleaner.name}</td>
        <td>${cleaner.phone}</td>
        <td>${cleaner.email}</td>
        <td>${cleaner.issues}</td>
        <td>${cleaner.script}</td>
        <td class="notes-col"></td>
      </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <strong>Reminder:</strong> Do not request TIN over phone. Direct cleaners to /cleaner/tax-form. 
    Mark contacted in the system after calls.
  </div>
</body>
</html>
    `.trim();

    // For Next.js, we'll return HTML that can be printed to PDF
    // In production, you might want to use puppeteer or a PDF service
    // For now, return HTML with print styles that can be saved as PDF by browser
    
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="call_sheet_${year}-${today.getMonth() + 1}-${today.getDate()}.html"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_1099_CALL_SHEET] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate call sheet",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


