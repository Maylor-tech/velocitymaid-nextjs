/**
 * Phase M: Miami Pilot - Payout Schedule API
 * 
 * GET /api/pilot/payouts/schedule
 * - Get payout schedule and summary for last week
 * 
 * POST /api/pilot/payouts/schedule
 * - Process weekly payouts for Miami pilot
 * - Requires ADMIN or BRANCH_OWNER role
 * - Supports dry-run mode
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { 
  getLastWeekRange, 
  getMiamiBranchId, 
  processWeeklyPayouts,
  getPayoutSummary,
  type WeeklyPayoutPeriod 
} from "@/lib/pilot/payoutCycle";

export const dynamic = "force-dynamic";

/**
 * Helper to require one of multiple roles
 */
async function requireAnyRole(
  request: NextRequest,
  roles: Array<"ADMIN" | "BRANCH_OWNER">
): Promise<{ userId: string; role: string; email?: string }> {
  const errors: any[] = [];
  
  for (const role of roles) {
    try {
      return await requireRole(request, role);
    } catch (error: any) {
      errors.push(error);
      // If it's not an auth error (401/403), re-throw immediately
      if (error instanceof NextResponse) {
        const status = error.status;
        if (status !== 401 && status !== 403) {
          throw error;
        }
      }
    }
  }
  
  // If all roles failed, throw the last error (usually 401)
  throw errors[errors.length - 1] || new Error("Authentication required");
}

/**
 * GET /api/pilot/payouts/schedule
 * Get payout schedule summary for last week
 */
export async function GET(request: NextRequest) {
  try {
    // In development, allow bypass with ?bypassAuth=true (for testing only)
    const { searchParams } = new URL(request.url);
    const bypassAuth = process.env.NODE_ENV === "development" && searchParams.get("bypassAuth") === "true";
    
    let auth: { userId: string; role: string; email?: string };
    
    if (bypassAuth) {
      console.warn("[M7 PAYOUT] ⚠️ AUTH BYPASSED - Development mode only");
      auth = { userId: "dev-bypass", role: "ADMIN" };
    } else {
      // Require ADMIN or BRANCH_OWNER
      auth = await requireAnyRole(request, ["ADMIN", "BRANCH_OWNER"]);
    }
    
    // Get Miami branch ID
    const branchId = await getMiamiBranchId();
    if (!branchId) {
      return NextResponse.json(
        { success: false, error: "Miami branch not found" },
        { status: 404 }
      );
    }
    
    // Get last week period
    const period = getLastWeekRange();
    
    // Get summary
    const summary = await getPayoutSummary(branchId, period);
    
    return NextResponse.json({
      success: true,
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
        weekLabel: period.weekLabel,
      },
      summary,
    });
  } catch (error: any) {
    console.error("[M7 PAYOUT ERROR] GET Error:", error);
    console.error("[M7 PAYOUT ERROR] Error type:", typeof error);
    console.error("[M7 PAYOUT ERROR] Error constructor:", error?.constructor?.name);
    
    // If it's already a NextResponse (from requireRole), return it directly
    if (error instanceof NextResponse || (error?.status && error?.json)) {
      return error;
    }
    
    // Extract error message from various error types
    let errorMessage = "Unknown error getting payout schedule";
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.toString && error.toString() !== "[object Object]") {
      errorMessage = error.toString();
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          stack: error?.stack,
          name: error?.name,
          type: typeof error,
          constructor: error?.constructor?.name,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pilot/payouts/schedule
 * Process weekly payouts for Miami pilot
 */
export async function POST(request: NextRequest) {
  try {
    // In development, allow bypass with ?bypassAuth=true (for testing only)
    const { searchParams } = new URL(request.url);
    const bypassAuth = process.env.NODE_ENV === "development" && searchParams.get("bypassAuth") === "true";
    
    let auth: { userId: string; role: string; email?: string };
    
    if (bypassAuth) {
      console.warn("[M7 PAYOUT] ⚠️ AUTH BYPASSED - Development mode only");
      auth = { userId: "dev-bypass", role: "ADMIN" };
    } else {
      // Require ADMIN or BRANCH_OWNER
      auth = await requireAnyRole(request, ["ADMIN", "BRANCH_OWNER"]);
    }
    
    const body = await request.json().catch(() => ({}));
    const { dryRun = false, adminOverride } = body;
    
    // Get Miami branch ID
    const branchId = await getMiamiBranchId();
    if (!branchId) {
      return NextResponse.json(
        { success: false, error: "Miami branch not found" },
        { status: 404 }
      );
    }
    
    // Get last week period
    const period = getLastWeekRange();
    
    // Validate admin override if provided
    if (adminOverride) {
      if (!adminOverride.reason || adminOverride.reason.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Admin override requires a reason" },
          { status: 400 }
        );
      }
      
      // Only ADMIN can use override
      if (auth.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Only ADMIN can use override" },
          { status: 403 }
        );
      }
      
      adminOverride.adminId = auth.userId;
    }
    
    // Process payouts
    const result = await processWeeklyPayouts(branchId, period, {
      dryRun,
      adminOverride: adminOverride || undefined,
    });
    
    return NextResponse.json({
      success: true,
      dryRun,
      result: {
        ...result,
        period: {
          start: result.period.start.toISOString(),
          end: result.period.end.toISOString(),
          weekLabel: result.period.weekLabel,
        },
        results: result.results.map((r) => ({
          ...r,
          amount: r.amount ? Number(r.amount) : undefined,
        })),
      },
      message: dryRun
        ? `Dry run: Would create ${result.createdPayouts} payout(s) for ${result.period.weekLabel}`
        : `Created ${result.createdPayouts} payout(s) for ${result.period.weekLabel}`,
    });
  } catch (error: any) {
    console.error("[M7 PAYOUT ERROR] POST Error:", error);
    console.error("[M7 PAYOUT ERROR] Error type:", typeof error);
    console.error("[M7 PAYOUT ERROR] Error constructor:", error?.constructor?.name);
    console.error("[M7 PAYOUT ERROR] Stack:", error?.stack);
    
    // If it's already a NextResponse (from requireRole), return it directly
    if (error instanceof NextResponse || (error?.status && error?.json)) {
      return error;
    }
    
    // Extract error message from various error types
    let errorMessage = "Unknown payout error";
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.toString && error.toString() !== "[object Object]") {
      errorMessage = error.toString();
    } else {
      // Try to stringify the error for debugging
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          stack: error?.stack,
          name: error?.name,
          type: typeof error,
          constructor: error?.constructor?.name,
          fullError: String(error),
        } : undefined,
      },
      { status: 500 }
    );
  }
}

