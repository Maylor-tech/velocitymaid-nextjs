/**
 * PHASE 12A: Shadow Mode Backtest API
 * 
 * POST /api/admin/payouts/shadow-backtest
 * 
 * Triggers shadow mode backtest (no payout writes)
 */

import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { runShadowBacktest } from "@/workers/payoutShadowBacktest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const body = await req.json().catch(() => ({}));
    const { daysBack, branchId, policyVersionId, limit } = body;

    const result = await runShadowBacktest();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || result.error || "Backtest failed",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result: result.result,
      message: "Shadow backtest completed",
    });
  } catch (error: any) {
    console.error("[SHADOW_BACKTEST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run shadow backtest",
      },
      { status: 500 }
    );
  }
}

