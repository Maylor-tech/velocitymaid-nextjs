/**
 * POST /api/admin/payouts/weekly-summary/send
 * 
 * Send weekly payout summary emails to cleaners
 * - Requires ADMIN auth
 * - Accepts {dateFrom, dateTo, dryRun?}
 * - Sends one email per cleaner with payouts in range
 * - Returns {sentCount, skippedNoEmailCount, failures[]}
 * - Does not fail entire batch if one email fails
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { buildWeeklyPayoutSummary } from "@/lib/payoutSummary";
import {
  getWeeklyPayoutSummarySubject,
  getWeeklyPayoutSummaryHTML,
  getWeeklyPayoutSummaryText,
} from "@/lib/email/templates/weeklyPayoutSummary";
import { resend } from "@/lib/email/resendClient";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { dateFrom, dateTo, dryRun } = body;

    // Validate required fields
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: dateFrom, dateTo" },
        { status: 400 }
      );
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Validate date range length (max 14 days)
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 14) {
      return NextResponse.json(
        { success: false, error: "Date range cannot exceed 14 days" },
        { status: 400 }
      );
    }

    if (daysDiff < 0) {
      return NextResponse.json(
        { success: false, error: "dateTo must be after dateFrom" },
        { status: 400 }
      );
    }

    // Validate email service is configured
    if (!process.env.RESEND_API_KEY && !dryRun) {
      return NextResponse.json(
        { success: false, error: "Email service is not configured (RESEND_API_KEY missing)" },
        { status: 500 }
      );
    }

    // Build payout summaries
    const summaryResult = await buildWeeklyPayoutSummary({
      dateFrom: fromDate,
      dateTo: toDate,
    });

    if (summaryResult.summaries.length === 0) {
      return NextResponse.json({
        success: true,
        dryRun,
        sentCount: 0,
        skippedNoEmailCount: 0,
        skippedNoPayoutsCount: 0,
        failures: [],
        message: "No payouts found in date range",
      });
    }

    // Get base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BASE_URL}`
      : "";

    // Send emails (or simulate if dryRun)
    const results = {
      sentCount: 0,
      skippedNoEmailCount: 0,
      failures: [] as Array<{ cleanerId: string; email: string; error: string }>,
    };

    for (const summary of summaryResult.summaries) {
      // Skip if no email
      if (!summary.cleanerEmail || !summary.cleanerEmail.includes("@")) {
        results.skippedNoEmailCount++;
        continue;
      }

      if (dryRun) {
        // Dry run - just count what would be sent
        results.sentCount++;
        continue;
      }

      // Send email (per-cleaner try/catch)
      try {
        const subject = getWeeklyPayoutSummarySubject(fromDate, toDate);
        const html = getWeeklyPayoutSummaryHTML(summary, baseUrl);
        const text = getWeeklyPayoutSummaryText(summary, baseUrl);

        await resend.emails.send({
          from: "VelocityMaid <onboarding@resend.dev>",
          to: summary.cleanerEmail,
          subject,
          html,
          text,
        });

        results.sentCount++;
        console.log(
          `[WEEKLY_PAYOUT_SUMMARY] Email sent to ${summary.cleanerEmail} (${summary.cleanerId})`
        );
      } catch (error: any) {
        // Individual email failure doesn't stop the batch
        results.failures.push({
          cleanerId: summary.cleanerId,
          email: summary.cleanerEmail,
          error: error.message || "Failed to send email",
        });
        console.error(
          `[WEEKLY_PAYOUT_SUMMARY] Failed to send email to ${summary.cleanerEmail}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: !!dryRun,
      sentCount: results.sentCount,
      skippedNoEmailCount: results.skippedNoEmailCount,
      skippedNoPayoutsCount: summaryResult.totalCleaners - summaryResult.summaries.length,
      failures: results.failures,
      totalCleaners: summaryResult.totalCleaners,
      totalPayouts: summaryResult.totalPayouts,
    });
  } catch (error: any) {
    console.error("[WEEKLY_PAYOUT_SUMMARY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send weekly payout summaries",
      },
      { status: 500 }
    );
  }
}
















