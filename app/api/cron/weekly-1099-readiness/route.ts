/**
 * Phase 3H.6: Weekly 1099 Readiness Email Cron Job
 * 
 * POST /api/cron/weekly-1099-readiness
 * 
 * Weekly cron job to send readiness reports to admins during January
 * Runs Monday 9am (scheduled in vercel.json)
 * 
 * Uses existing readiness computation from /api/admin/1099/[year]/readiness
 * Skips sending outside January
 * 
 * Security: Protected by CRON_SECRET header
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus, UserRole } from "@prisma/client";
import {
  getWeekly1099ReadinessEmailSubject,
  getWeekly1099ReadinessEmailHTML,
  getWeekly1099ReadinessEmailText,
  getReadinessStatusBand,
} from "@/lib/tax/weekly1099ReadinessEmail";

export async function POST(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const secret = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON_WEEKLY_1099_READINESS] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (secret !== cronSecret) {
      console.warn("[CRON_WEEKLY_1099_READINESS] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if we're in January - skip if not
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = January, 11 = December

    if (currentMonth !== 0) {
      // Not January, skip sending
      console.log(
        `[CRON_WEEKLY_1099_READINESS] Skipping - not January (current month: ${currentMonth + 1})`
      );
      return NextResponse.json({
        success: true,
        message: "Skipped - not January",
        skipped: true,
      });
    }

    const currentYear = now.getFullYear();

    // Optional: Dry-run mode
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry") === "true";

    if (dryRun) {
      console.log("[CRON_WEEKLY_1099_READINESS] DRY RUN MODE - No emails will be sent");
    }

    console.log(
      `[CRON_WEEKLY_1099_READINESS] Processing weekly readiness report for ${currentYear}`
    );

    // 1️⃣ Fetch readiness data using internal logic (reuse from readiness endpoint)
    // We'll call the readiness computation directly
    const thresholdCents = currentYear === 2025 ? 600100 : 2000100;

    // Calculate date range for current year
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

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
            stripePayoutsEnabled: true,
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
        totalAmountCents: number;
        stripePayoutsEnabled: boolean;
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
          totalAmountCents: transfer.amountCents,
          stripePayoutsEnabled: transfer.cleaner.stripePayoutsEnabled,
        });
      }
    }

    // Filter cleaners who meet threshold
    const eligibleCleanerIds = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => cleaner.cleanerId);

    if (eligibleCleanerIds.length === 0) {
      console.log("[CRON_WEEKLY_1099_READINESS] No cleaners meet the threshold");
      return NextResponse.json({
        success: true,
        message: "No cleaners meet the threshold",
        overallScore: 0,
        emailsSent: 0,
      });
    }

    // Fetch tax profiles for eligible cleaners
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
      },
    });

    const taxProfileMap = new Map(
      taxProfiles.map((profile) => [profile.cleanerId, profile])
    );

    // Check which cleaners have statements
    const cleanersWithStatements = await prisma.payoutTransfer.findMany({
      where: {
        cleanerId: { in: eligibleCleanerIds },
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

    // Calculate readiness for each eligible cleaner
    const cleaners = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => {
        const taxProfile = taxProfileMap.get(cleaner.cleanerId);

        const w9Verified = taxProfile?.status === TaxProfileStatus.VERIFIED;
        const addressComplete =
          !!taxProfile?.addressLine1 &&
          !!taxProfile?.city &&
          !!taxProfile?.state &&
          !!taxProfile?.zipCode;
        const stripePayoutsEnabled = cleaner.stripePayoutsEnabled;
        const hasStatements = cleanersWithStatementsSet.has(cleaner.cleanerId);

        let score = 0;
        if (w9Verified) score += 60;
        if (addressComplete) score += 20;
        if (stripePayoutsEnabled) score += 10;
        if (hasStatements) score += 10;

        const blockerType = !w9Verified
          ? "W9_NOT_VERIFIED"
          : !addressComplete
          ? "ADDRESS_INCOMPLETE"
          : !stripePayoutsEnabled
          ? "STRIPE_PAYOUTS_DISABLED"
          : !hasStatements
          ? "NO_STATEMENTS"
          : null;

        return {
          cleanerId: cleaner.cleanerId,
          score,
          blockerType,
        };
      });

    // Calculate overall score
    const overallScore =
      cleaners.length > 0
        ? cleaners.reduce((sum, c) => sum + c.score, 0) / cleaners.length
        : 0;

    // Calculate blockers
    const blockerCounts = new Map<string, number>();

    for (const cleaner of cleaners) {
      if (cleaner.blockerType) {
        blockerCounts.set(
          cleaner.blockerType,
          (blockerCounts.get(cleaner.blockerType) || 0) + 1
        );
      }
    }

    const blockerLabels: Record<string, string> = {
      W9_NOT_VERIFIED: "W-9 Not Verified",
      ADDRESS_INCOMPLETE: "Address Incomplete",
      STRIPE_PAYOUTS_DISABLED: "Stripe Payouts Disabled",
      NO_STATEMENTS: "No Statements",
    };

    const blockers = Array.from(blockerCounts.entries())
      .map(([type, count]) => ({
        type,
        label: blockerLabels[type] || type,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const statusBand = getReadinessStatusBand(overallScore);

    // 2️⃣ Fetch all admin users
    const admins = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (admins.length === 0) {
      console.warn("[CRON_WEEKLY_1099_READINESS] No admin users found");
      return NextResponse.json({
        success: true,
        message: "No admin users found",
        overallScore,
        emailsSent: 0,
      });
    }

    // 3️⃣ Send emails to all admins
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/admin/taxes/1099?year=${currentYear}`;

    let emailsSent = 0;
    let emailsFailed = 0;

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY && !dryRun) {
      console.error("[CRON_WEEKLY_1099_READINESS] RESEND_API_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured",
        },
        { status: 500 }
      );
    }

    for (const admin of admins) {
      if (!admin.email) {
        console.warn(
          `[CRON_WEEKLY_1099_READINESS] Skipping admin ${admin.id} - no email`
        );
        continue;
      }

      if (dryRun) {
        console.log(
          `[CRON_WEEKLY_1099_READINESS] DRY RUN: Would send readiness report to ${admin.email}`
        );
        emailsSent++;
        continue;
      }

      try {
        const { Resend } = await import("resend");
        const { getResendFromEmail } = await import("@/lib/email/resendClient");
        const resend = new Resend(process.env.RESEND_API_KEY!);

        const subject = getWeekly1099ReadinessEmailSubject(
          currentYear,
          overallScore,
          statusBand.label
        );
        const html = getWeekly1099ReadinessEmailHTML({
          year: currentYear,
          overallScore,
          statusBand,
          eligibleCleanersCount: eligibleCleanerIds.length,
          blockers,
          dashboardUrl,
        });
        const text = getWeekly1099ReadinessEmailText({
          year: currentYear,
          overallScore,
          statusBand,
          eligibleCleanersCount: eligibleCleanerIds.length,
          blockers,
          dashboardUrl,
        });

        await resend.emails.send({
          from: getResendFromEmail(),
          to: admin.email,
          subject,
          html,
          text,
        });

        console.log(
          `[CRON_WEEKLY_1099_READINESS] Sent readiness report to ${admin.email}`
        );
        emailsSent++;
      } catch (error: any) {
        console.error(
          `[CRON_WEEKLY_1099_READINESS] Failed to send email to ${admin.email}:`,
          error
        );
        emailsFailed++;
      }
    }

    // 4️⃣ Return summary
    return NextResponse.json({
      success: true,
      message: "Weekly 1099 readiness report processed",
      year: currentYear,
      overallScore: Math.round(overallScore * 100) / 100,
      statusBand: statusBand.label,
      eligibleCleanersCount: eligibleCleanerIds.length,
      blockersCount: blockers.length,
      adminsNotified: admins.length,
      emailsSent,
      emailsFailed,
      dryRun,
    });
  } catch (error: any) {
    console.error("[CRON_WEEKLY_1099_READINESS] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process weekly readiness report",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health checks
 */
export async function GET() {
  return NextResponse.json({
    service: "weekly-1099-readiness-cron",
    status: "ok",
    message: "Weekly 1099 readiness cron endpoint is active",
    note: "Only runs during January",
  });
}

