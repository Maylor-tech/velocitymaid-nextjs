/**
 * Phase M: Send Job Reminders API
 * 
 * POST /api/pilot/send-reminders
 * 
 * Manually trigger 24-hour reminder sending.
 * Also runs as cron job.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { processJobReminders } from "@/workers/send-job-reminders";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["ADMIN"]);

    const result = await processJobReminders();

    return NextResponse.json({
      success: true,
      ...result,
      message: `Processed ${result.processed} jobs: ${result.sent} sent, ${result.failed} failed`,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[PILOT_SEND_REMINDERS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send reminders",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pilot/send-reminders
 * 
 * Get status of reminders (for cron job)
 */
export async function GET(request: NextRequest) {
  try {
    // Allow cron job to call without auth (if using secret token)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Fallback to role check
      await requireRole(request, ["ADMIN"]);
    }

    const result = await processJobReminders();

    return NextResponse.json({
      success: true,
      ...result,
      message: `Processed ${result.processed} jobs: ${result.sent} sent, ${result.failed} failed`,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("[PILOT_SEND_REMINDERS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send reminders",
      },
      { status: 500 }
    );
  }
}










