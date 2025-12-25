/**
 * Shadow Backtest Runner
 * 
 * Compares legacy payout amounts (v1) with new policy engine amounts (v2)
 * and stores results in payout_policy_shadow_results.
 * 
 * NO money movement. NO ledger writes. Pure comparison.
 */

import { prisma } from "../lib/prisma";
import { getActivePolicyVersionIdForBranch } from "../services/payout/getActivePolicyVersion";
import { evaluatePayout } from "../services/payout/evaluatePayout";
import { validateRules } from "../services/payout/ruleSchema";
import { JobStatus } from "@prisma/client";

// ============================================================================
// TYPES
// ============================================================================

export interface ShadowBacktestOptions {
  days?: number;
  maxJobs?: number;
  branchId?: string;
}

export interface ShadowBacktestResult {
  processed: number;
  stored: number;
  skipped_no_policy: number;
  skipped_no_legacy: number;
  errors: number;
  errorDetails?: string[];
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

/**
 * Run shadow backtest for completed jobs
 * 
 * @param options - Backtest options
 * @returns Summary of results
 */
export async function runPayoutShadowBacktest(
  options: ShadowBacktestOptions = {}
): Promise<ShadowBacktestResult> {
  const {
    days = parseInt(process.env.PAYOUT_SHADOW_DAYS || "30"),
    maxJobs = parseInt(process.env.PAYOUT_SHADOW_MAX_JOBS || "500"),
    branchId,
  } = options;

  const mode = process.env.PAYOUT_POLICY_ENGINE_MODE || "off";

  // Check if shadow mode is enabled
  if (mode !== "shadow") {
    console.warn(
      "[SHADOW_BACKTEST] Shadow mode is disabled. Set PAYOUT_POLICY_ENGINE_MODE=shadow to enable."
    );
    return {
      processed: 0,
      stored: 0,
      skipped_no_policy: 0,
      skipped_no_legacy: 0,
      errors: 0,
    };
  }

  console.log(`[SHADOW_BACKTEST] Starting backtest (days: ${days}, maxJobs: ${maxJobs})`);

  const result: ShadowBacktestResult = {
    processed: 0,
    stored: 0,
    skipped_no_policy: 0,
    skipped_no_legacy: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Fetch eligible completed jobs
    const whereClause: any = {
      status: JobStatus.COMPLETED,
      completedAt: {
        gte: startDate,
        lte: now,
      },
      branchId: branchId ? branchId : undefined,
    };

    const jobs = await prisma.job.findMany({
      where: whereClause,
      select: {
        id: true,
        branchId: true,
        totalPrice: true,
        serviceType: true,
        jobQualityScore: true,
        completedAt: true,
        assignedCleanerId: true,
        currency: true,
      },
      take: maxJobs,
      orderBy: {
        completedAt: "desc",
      },
    });

    console.log(`[SHADOW_BACKTEST] Found ${jobs.length} eligible jobs`);

    // Process each job
    for (const job of jobs) {
      result.processed++;

      try {
        // Skip if no cleaner assigned
        if (!job.assignedCleanerId) {
          console.log(`[SHADOW_BACKTEST] Job ${job.id}: No cleaner assigned`);
          result.skipped_no_legacy++;
          continue;
        }

        // Find active policy version for branch at job completion time
        const policyVersionId = await getActivePolicyVersionIdForBranch(
          job.branchId,
          job.completedAt || new Date()
        );

        if (!policyVersionId) {
          console.log(`[SHADOW_BACKTEST] Job ${job.id}: No active policy for branch ${job.branchId}`);
          result.skipped_no_policy++;
          continue;
        }

        // Fetch policy version and rules
        const policyVersion = await prisma.payoutPolicyVersion.findUnique({
          where: { id: policyVersionId },
          select: {
            id: true,
            name: true,
            status: true,
          },
        });

        if (!policyVersion || policyVersion.status !== "published") {
          result.skipped_no_policy++;
          continue;
        }

        const ruleRecords = await prisma.payoutPolicyRule.findMany({
          where: {
            policyVersionId: policyVersionId,
            isActive: true,
          },
          orderBy: {
            priority: "asc",
          },
        });

        // Validate and parse rules
        const rules = ruleRecords
          .map((r) => ({
            id: r.id,
            priority: r.priority,
            isActive: r.isActive,
            rule: r.rule as any, // JSON from DB
          }))
          .filter((r) => r.isActive);

        const validRules = validateRules(rules.map((r) => r.rule));

        if (validRules.length === 0) {
          console.warn(
            `[SHADOW_BACKTEST] No valid rules for policy ${policyVersionId}`
          );
          result.skipped_no_policy++;
          continue;
        }

        // Get payee (cleaner) info
        const payee = await prisma.user.findUnique({
          where: { id: job.assignedCleanerId },
          select: {
            id: true,
            branchId: true,
          },
        });

        if (!payee) {
          result.skipped_no_legacy++;
          continue;
        }

        // Compute v2 payout using new engine
        const v2Result = evaluatePayout({
          job: {
            id: job.id,
            totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
            subtotal: job.totalPrice ? Number(job.totalPrice) : null, // Use totalPrice as subtotal if no separate subtotal
            serviceType: job.serviceType,
            jobQualityScore: job.jobQualityScore,
            branchId: job.branchId,
          },
          payee: {
            id: payee.id,
            branchId: payee.branchId || job.branchId,
          },
          policyVersion: {
            id: policyVersion.id,
            name: policyVersion.name,
            status: policyVersion.status,
          },
          rules: validRules.map((rule, idx) => ({
            id: rules[idx].id,
            priority: rules[idx].priority,
            isActive: true,
            rule: rule,
          })),
        });

        // Get v1 (legacy) payout amount
        // Check JobPayout first (most reliable source)
        const jobPayout = await prisma.jobPayout.findFirst({
          where: {
            jobId: job.id,
            cleanerId: job.assignedCleanerId,
          },
          select: {
            cleanerAmount: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        let v1Amount: number | null = null;

        if (jobPayout) {
          v1Amount = Number(jobPayout.cleanerAmount);
        } else {
          // Fallback: Check TransactionLedger for cleaner payout
          // Try multiple transaction types that might represent payouts
          const ledgerEntry = await prisma.transactionLedger.findFirst({
            where: {
              OR: [
                {
                  referenceId: job.id,
                  referenceType: "JOB_PAYOUT",
                  cleanerId: job.assignedCleanerId,
                },
                {
                  referenceId: job.id,
                  referenceType: "JOB",
                  cleanerId: job.assignedCleanerId,
                },
              ],
              transactionType: {
                in: ["CLEANER_PAYOUT", "PAYOUT", "PAYMENT", "EARNINGS"],
              },
            },
            select: {
              amount: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (ledgerEntry) {
            v1Amount = ledgerEntry.amount;
          }
        }

        if (v1Amount === null) {
          console.log(`[SHADOW_BACKTEST] Job ${job.id}: No legacy payout found (checked JobPayout and TransactionLedger)`);
          result.skipped_no_legacy++;
          continue;
        }

        // Calculate delta
        const delta = v2Result.totalAmount - v1Amount;

        // Store shadow result (idempotent: check if exists first)
        const existingResult = await prisma.payoutPolicyShadowResult.findFirst({
          where: {
            jobId: job.id,
            policyVersionId: policyVersionId,
          },
        });

        const shadowResultData = {
            jobId: job.id,
            branchId: job.branchId,
            policyVersionId: policyVersionId,
            v1Amount: v1Amount,
            v2Amount: v2Result.totalAmount,
            delta: delta,
            details: {
              v2Breakdown: v2Result.breakdown,
              policyEvalHash: v2Result.policyEvalHash,
              jobCompletedAt: job.completedAt?.toISOString(),
              cleanerId: job.assignedCleanerId,
              policyVersionName: policyVersion.name,
              metadata: {
                processedAt: new Date().toISOString(),
                source: "shadow_backtest",
              },
            },
          };

        if (existingResult) {
          // Update existing record
          await prisma.payoutPolicyShadowResult.update({
            where: { id: existingResult.id },
            data: shadowResultData,
          });
        } else {
          // Create new record
          await prisma.payoutPolicyShadowResult.create({
            data: shadowResultData,
          });
        }

        result.stored++;
      } catch (error: any) {
        result.errors++;
        const errorMsg = `Job ${job.id}: ${error.message}`;
        result.errorDetails?.push(errorMsg);
        console.error(`[SHADOW_BACKTEST] Error processing job ${job.id}:`, error);
      }
    }

    console.log(`[SHADOW_BACKTEST] Complete:`, result);
    return result;
  } catch (error: any) {
    console.error("[SHADOW_BACKTEST] Fatal error:", error);
    result.errors++;
    result.errorDetails?.push(`Fatal: ${error.message}`);
    return result;
  }
}

/**
 * Verification SQL Queries (for dev/debugging):
 * 
 * -- Count total shadow results
 * select count(*) from "PayoutPolicyShadowResult";
 * 
 * -- Count by branch
 * select "branchId", count(*)
 * from "PayoutPolicyShadowResult"
 * group by "branchId"
 * order by count(*) desc;
 * 
 * -- Recent results
 * select *
 * from "PayoutPolicyShadowResult"
 * order by "createdAt" desc
 * limit 20;
 * 
 * -- Delta analysis
 * select 
 *   avg(delta) as avg_delta,
 *   min(delta) as min_delta,
 *   max(delta) as max_delta,
 *   count(*) as total
 * from "PayoutPolicyShadowResult";
 */
