/**
 * Phase M: Miami Pilot - Weekly Payouts Cron Job
 * 
 * GET /api/cron/pilot/weekly-payouts
 * 
 * Automated weekly payout processing for Miami pilot.
 * Runs every Monday to process payouts for the previous week.
 * 
 * Schedule: Weekly (same day/time) - Monday mornings
 * Protected by CRON_SECRET header
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { runWeeklyPayouts } from "@/workers/weekly-payouts";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("authorization")?.replace("Bearer ", "");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[WEEKLY_PAYOUTS_CRON] Starting weekly payout processing...");

    // Run weekly payouts
    const result = await runWeeklyPayouts({ dryRun: false });

    if (!result.success) {
      console.error("[WEEKLY_PAYOUTS_CRON] Error:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to process weekly payouts",
          period: result.period,
        },
        { status: 500 }
      );
    }

    console.log(
      `[WEEKLY_PAYOUTS_CRON] Completed: ${result.result?.createdPayouts || 0} payout(s) created for ${result.period.weekLabel}`
    );

    return NextResponse.json({
      success: true,
      period: result.period,
      result: result.result
        ? {
            ...result.result,
            period: {
              start: result.result.period.start.toISOString(),
              end: result.result.period.end.toISOString(),
              weekLabel: result.result.period.weekLabel,
            },
            results: result.result.results.map((r) => ({
              ...r,
              amount: r.amount ? Number(r.amount) : undefined,
            })),
          }
        : undefined,
      message: `Processed ${result.result?.createdPayouts || 0} payout(s) for ${result.period.weekLabel}`,
    });
  } catch (error: any) {
    console.error("[WEEKLY_PAYOUTS_CRON] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unexpected error processing weekly payouts",
      },
      { status: 500 }
    );
  }
}


