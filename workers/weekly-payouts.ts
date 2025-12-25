/**
 * Phase M: Miami Pilot - Weekly Payout Worker
 * 
 * Automated weekly payout processing for Miami pilot.
 * Runs every Monday to process payouts for the previous week.
 * 
 * Schedule: Weekly (same day/time) - Monday mornings
 * Rules:
 * - Only completed + verified jobs
 * - No exceptions without admin override + reason
 * 
 * Usage:
 * - Can be called from cron job
 * - Can be called manually via API
 * - Supports dry-run mode
 */

import { 
  getLastWeekRange, 
  getMiamiBranchId, 
  processWeeklyPayouts,
  type WeeklyPayoutResult 
} from "../lib/pilot/payoutCycle";

export interface WeeklyPayoutWorkerResult {
  success: boolean;
  period: {
    start: string;
    end: string;
    weekLabel: string;
  };
  result?: WeeklyPayoutResult;
  error?: string;
  dryRun?: boolean;
}

/**
 * Process weekly payouts for Miami pilot
 * 
 * This is the main worker function that can be called from:
 * - Cron job (via API route)
 * - Manual trigger (via API route)
 * - Direct import
 */
export async function runWeeklyPayouts(
  options?: {
    dryRun?: boolean;
    adminOverride?: {
      adminId: string;
      reason: string;
    };
  }
): Promise<WeeklyPayoutWorkerResult> {
  try {
    console.log("[WEEKLY_PAYOUTS] Starting weekly payout processing...");
    
    // Get Miami branch ID
    const branchId = await getMiamiBranchId();
    if (!branchId) {
      throw new Error("Miami branch not found. Please ensure Miami branch is set up.");
    }
    
    // Get last week period
    const period = getLastWeekRange();
    console.log(`[WEEKLY_PAYOUTS] Processing period: ${period.weekLabel} (${period.start.toISOString()} to ${period.end.toISOString()})`);
    
    // Process payouts
    const result = await processWeeklyPayouts(branchId, period, options);
    
    console.log(`[WEEKLY_PAYOUTS] Completed: ${result.createdPayouts} payout(s) created, ${result.skippedJobs} skipped, $${result.totalAmount.toFixed(2)} total`);
    
    if (result.errors.length > 0) {
      console.warn(`[WEEKLY_PAYOUTS] Errors encountered:`, result.errors);
    }
    
    return {
      success: true,
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
        weekLabel: period.weekLabel,
      },
      result,
      dryRun: options?.dryRun || false,
    };
  } catch (error: any) {
    console.error("[WEEKLY_PAYOUTS] Error:", error);
    return {
      success: false,
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        weekLabel: "Error",
      },
      error: error.message || "Unknown error",
      dryRun: options?.dryRun || false,
    };
  }
}

/**
 * Main entry point for cron job
 * Can be called directly or via API route
 */
export default async function weeklyPayoutsCron() {
  return await runWeeklyPayouts({ dryRun: false });
}










