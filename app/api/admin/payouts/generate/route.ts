/**
 * POST /api/admin/payouts/generate
 * 
 * Admin endpoint to generate JobPayout records from completed jobs
 * - Requires ADMIN auth
 * - Uses the generatePayouts worker
 * - Returns summary of created/skipped payouts
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { generatePayouts } from "@/workers/generatePayouts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { jobId, branchId, dateFrom, dateTo } = body;

    // Generate payouts using the worker
    const result = await generatePayouts({
      jobId,
      branchId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      triggeredBy: "ADMIN_MANUAL",
    });

    // Calculate total skipped
    const totalSkipped = 
      (result.skipped_no_cleaner || 0) +
      (result.skipped_no_payment_method || 0) +
      (result.skipped_no_policy || 0) +
      (result.skipped_already_exists || 0);

    return NextResponse.json({
      success: true,
      processed: result.processed || 0,
      created: result.created || 0,
      skipped: totalSkipped,
      skipped_no_cleaner: result.skipped_no_cleaner || 0,
      skipped_no_payment_method: result.skipped_no_payment_method || 0,
      skipped_no_policy: result.skipped_no_policy || 0,
      skipped_already_exists: result.skipped_already_exists || 0,
      errors: result.errors || 0,
      errorDetails: result.errorDetails || [],
      skippedJobs: result.skippedJobs || [],
      debug: result.debug || [], // Comprehensive debug results
      message: `Generated ${result.created || 0} payout(s), skipped ${totalSkipped} job(s)`,
    });
  } catch (error: any) {
    console.error("[ADMIN_GENERATE_PAYOUTS] Error:", error);
    console.error("[ADMIN_GENERATE_PAYOUTS] Error stack:", error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate payouts",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

