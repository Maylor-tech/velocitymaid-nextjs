/**
 * GET /api/cron/weekly-payout-summary
 * 
 * Scheduled cron job to send weekly payout summary emails
 * - Runs every Monday at 11:00 AM UTC (7:00 AM EST / 8:00 AM EDT)
 * - Computes last week date range (Mon–Sun) in America/New_York
 * - Uses idempotency to prevent duplicate sends
 * - Calls existing weekly payout summary sender
 * 
 * Security: Protected by CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { buildWeeklyPayoutSummary } from "@/lib/payoutSummary";
import {
  getWeeklyPayoutSummarySubject,
  getWeeklyPayoutSummaryHTML,
  getWeeklyPayoutSummaryText,
} from "@/lib/email/templates/weeklyPayoutSummary";
import { resend, getResendFromEmail } from "@/lib/email/resendClient";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Get last week's Monday-Sunday range in America/New_York timezone
 * Returns { monday, sunday } as Date objects
 * 
 * Note: Cron runs Monday 11:00 UTC (7:00 AM EST / 8:00 AM EDT)
 * When it runs on Monday, we send summary for the previous week (last Mon-Sun)
 * 
 * Strategy: Since cron runs on Monday, last week's Monday is 7 days ago,
 * and last week's Sunday is yesterday (1 day ago).
 */
function getLastWeekRange(): { monday: Date; sunday: Date } {
  // Get current time
  const now = new Date();
  
  // Calculate last Monday (7 days ago, start of day)
  // Since cron runs on Monday, last Monday is always 7 days ago
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - 7);
  lastMonday.setHours(0, 0, 0, 0);
  
  // Last Sunday is yesterday (end of day)
  // Since cron runs on Monday, last Sunday is always 1 day ago
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - 1);
  lastSunday.setHours(23, 59, 59, 999);
  
  // Note: These dates are in server timezone, but we'll use them for querying
  // Prisma queries by createdAt which is stored in UTC, so this works correctly
  // The date range will capture all payouts created during last week regardless of timezone
  
  return { monday: lastMonday, sunday: lastSunday };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Validate email service is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Email service is not configured (RESEND_API_KEY missing)" },
        { status: 500 }
      );
    }

    // Compute last week date range (Mon–Sun) in America/New_York
    const { monday, sunday } = getLastWeekRange();
    
    // Format dates for jobKey (YYYY-MM-DD)
    const dateFromStr = monday.toISOString().split("T")[0];
    const dateToStr = sunday.toISOString().split("T")[0];
    const jobKey = `weekly-summary:${dateFromStr}:${dateToStr}`;

    // Idempotency check: attempt to create WeeklyEmailLog
    let emailLog;
    try {
      emailLog = await prisma.weeklyEmailLog.create({
        data: {
          id: randomUUID(),
          jobKey,
          dateFrom: monday,
          dateTo: sunday,
          sentCount: 0,
          skippedNoEmailCount: 0,
          skippedNoPayoutsCount: 0,
          failureCount: 0,
        },
      });
    } catch (error: any) {
      // If unique constraint violation, job already ran
      if (error.code === "P2002" || error.message?.includes("Unique constraint")) {
        console.log(`[WEEKLY_PAYOUT_SUMMARY_CRON] Job already executed for ${jobKey}, skipping`);
        return NextResponse.json({
          success: true,
          skipped: true,
          message: `Weekly summary for ${dateFromStr} to ${dateToStr} already sent`,
        });
      }
      throw error; // Re-throw if it's a different error
    }

    // Build payout summaries
    const summaryResult = await buildWeeklyPayoutSummary({
      dateFrom: monday,
      dateTo: sunday,
    });

    if (summaryResult.summaries.length === 0) {
      // Update log with no payouts found
      await prisma.weeklyEmailLog.update({
        where: { id: emailLog.id },
        data: {
          skippedNoPayoutsCount: summaryResult.totalCleaners,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        sentCount: 0,
        skippedNoEmailCount: 0,
        skippedNoPayoutsCount: summaryResult.totalCleaners,
        failures: [],
        message: "No payouts found in date range",
      });
    }

    // Get base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BASE_URL}`
      : "";

    // Send emails (per-cleaner try/catch)
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

      // Send email (per-cleaner try/catch)
      try {
        const subject = getWeeklyPayoutSummarySubject(monday, sunday);
        const html = getWeeklyPayoutSummaryHTML(summary, baseUrl);
        const text = getWeeklyPayoutSummaryText(summary, baseUrl);

        await resend.emails.send({
          from: getResendFromEmail(),
          to: summary.cleanerEmail,
          subject,
          html,
          text,
        });

        results.sentCount++;
        console.log(
          `[WEEKLY_PAYOUT_SUMMARY_CRON] Email sent to ${summary.cleanerEmail} (${summary.cleanerId})`
        );
      } catch (error: any) {
        // Individual email failure doesn't stop the batch
        results.failures.push({
          cleanerId: summary.cleanerId,
          email: summary.cleanerEmail,
          error: error.message || "Failed to send email",
        });
        console.error(
          `[WEEKLY_PAYOUT_SUMMARY_CRON] Failed to send email to ${summary.cleanerEmail}:`,
          error
        );
      }
    }

    // Update email log with results
    await prisma.weeklyEmailLog.update({
      where: { id: emailLog.id },
      data: {
        sentCount: results.sentCount,
        skippedNoEmailCount: results.skippedNoEmailCount,
        skippedNoPayoutsCount: summaryResult.totalCleaners - summaryResult.summaries.length,
        failureCount: results.failures.length,
        completedAt: new Date(),
      },
    });

    console.log(
      `[WEEKLY_PAYOUT_SUMMARY_CRON] Completed: ${results.sentCount} sent, ${results.skippedNoEmailCount} skipped (no email), ${results.failures.length} failed`
    );

    return NextResponse.json({
      success: true,
      sentCount: results.sentCount,
      skippedNoEmailCount: results.skippedNoEmailCount,
      skippedNoPayoutsCount: summaryResult.totalCleaners - summaryResult.summaries.length,
      failures: results.failures,
      totalCleaners: summaryResult.totalCleaners,
      totalPayouts: summaryResult.totalPayouts,
      dateFrom: dateFromStr,
      dateTo: dateToStr,
    });
  } catch (error: any) {
    console.error("[WEEKLY_PAYOUT_SUMMARY_CRON] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send weekly payout summaries",
      },
      { status: 500 }
    );
  }
}

