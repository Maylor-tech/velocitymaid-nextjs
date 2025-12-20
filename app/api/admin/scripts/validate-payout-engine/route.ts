/**
 * Admin Script: Validate Payout Engine
 * 
 * POST /api/admin/scripts/validate-payout-engine
 * 
 * Runs end-to-end validation of the payout engine.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { validatePayoutEngine } from "@/scripts/validate-payout-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check

    const result = await validatePayoutEngine();

    return NextResponse.json({
      success: result.success,
      results: result.results,
      summary: {
        totalSteps: result.results.length,
        passed: result.results.filter((r) => r.success).length,
        failed: result.results.filter((r) => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error("[VALIDATE_PAYOUT_ENGINE_API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to validate payout engine",
      },
      { status: 500 }
    );
  }
}







