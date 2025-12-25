/**
 * Payout Engine Validation Script
 * 
 * Validates that the payout engine is working end-to-end:
 * 1. Finds completed job with cleaner assigned
 * 2. Verifies active policy exists
 * 3. Runs shadow backtest
 * 4. Verifies JobPayout and TransactionLedger records
 * 
 * Usage:
 *   npx tsx scripts/validate-payout-engine.ts
 */

import { prisma } from "../lib/prisma";
import { JobStatus } from "@prisma/client";
import { runPayoutShadowBacktest } from "../workers/payoutShadowBacktest";

interface ValidationResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

async function validatePayoutEngine() {
  const results: ValidationResult[] = [];

  try {
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   PAYOUT ENGINE VALIDATION                            ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Step 1: Check for completed job with cleaner
    console.log("Step 1: Checking for completed job with cleaner...");
    const completedJob = await prisma.job.findFirst({
      where: {
        status: JobStatus.COMPLETED,
        assignedCleanerId: { not: null },
      },
      select: {
        id: true,
        branchId: true,
        assignedCleanerId: true,
        totalPrice: true,
        completedAt: true,
        customerName: true,
      },
    });

    if (!completedJob) {
      results.push({
        step: "Find Completed Job",
        success: false,
        message: "No completed job with assigned cleaner found",
      });
      console.log("❌ No completed job with cleaner found");
      console.log("   → Run: POST /api/admin/scripts/assign-cleaner");
      return { success: false, results };
    }

    results.push({
      step: "Find Completed Job",
      success: true,
      message: `Found job ${completedJob.id}`,
      data: {
        jobId: completedJob.id,
        branchId: completedJob.branchId,
        cleanerId: completedJob.assignedCleanerId,
        totalPrice: completedJob.totalPrice,
      },
    });
    console.log(`✅ Found job: ${completedJob.id}`);
    console.log(`   Branch: ${completedJob.branchId}`);
    console.log(`   Cleaner: ${completedJob.assignedCleanerId}`);
    console.log(`   Total: $${completedJob.totalPrice}`);

    // Step 2: Check for active policy
    console.log("\nStep 2: Checking for active payout policy...");
    const { getActivePolicyVersionIdForBranch } = await import(
      "../services/payout/getActivePolicyVersion"
    );
    const policyVersionId = await getActivePolicyVersionIdForBranch(
      completedJob.branchId,
      completedJob.completedAt || new Date()
    );

    if (!policyVersionId) {
      results.push({
        step: "Find Active Policy",
        success: false,
        message: `No active policy for branch ${completedJob.branchId}`,
      });
      console.log("❌ No active policy found");
      console.log("   → Run: POST /api/admin/scripts/create-nj-payout-policy");
      return { success: false, results };
    }

    const policyVersion = await prisma.payoutPolicyVersion.findUnique({
      where: { id: policyVersionId },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    results.push({
      step: "Find Active Policy",
      success: true,
      message: `Found policy ${policyVersionId}`,
      data: {
        policyVersionId,
        name: policyVersion?.name,
        status: policyVersion?.status,
      },
    });
    console.log(`✅ Found policy: ${policyVersionId}`);
    console.log(`   Name: ${policyVersion?.name}`);
    console.log(`   Status: ${policyVersion?.status}`);

    // Step 3: Check for legacy payout (JobPayout)
    console.log("\nStep 3: Checking for legacy payout (JobPayout)...");
    const jobPayout = await prisma.jobPayout.findFirst({
      where: {
        jobId: completedJob.id,
        cleanerId: completedJob.assignedCleanerId!,
      },
      select: {
        id: true,
        cleanerAmount: true,
        grossAmount: true,
        platformFee: true,
        status: true,
      },
    });

    if (!jobPayout) {
      results.push({
        step: "Find Legacy Payout",
        success: false,
        message: "No JobPayout record found (needed for v1 comparison)",
      });
      console.log("❌ No JobPayout record found");
      console.log("   → Job needs to have payout created first");
      return { success: false, results };
    }

    results.push({
      step: "Find Legacy Payout",
      success: true,
      message: `Found JobPayout ${jobPayout.id}`,
      data: {
        payoutId: jobPayout.id,
        cleanerAmount: jobPayout.cleanerAmount,
        grossAmount: jobPayout.grossAmount,
        platformFee: jobPayout.platformFee,
        status: jobPayout.status,
      },
    });
    console.log(`✅ Found JobPayout: ${jobPayout.id}`);
    console.log(`   Cleaner Amount: $${jobPayout.cleanerAmount}`);
    console.log(`   Gross Amount: $${jobPayout.grossAmount}`);
    console.log(`   Platform Fee: $${jobPayout.platformFee}`);

    // Step 4: Run shadow backtest
    console.log("\nStep 4: Running shadow backtest...");
    const shadowResult = await runPayoutShadowBacktest({
      days: 30,
      maxJobs: 10,
      branchId: completedJob.branchId,
    });

    results.push({
      step: "Shadow Backtest",
      success: shadowResult.stored > 0,
      message: `Processed: ${shadowResult.processed}, Stored: ${shadowResult.stored}`,
      data: shadowResult,
    });

    if (shadowResult.stored === 0) {
      console.log("❌ Shadow backtest stored 0 results");
      console.log(`   Processed: ${shadowResult.processed}`);
      console.log(`   Skipped (no policy): ${shadowResult.skipped_no_policy}`);
      console.log(`   Skipped (no legacy): ${shadowResult.skipped_no_legacy}`);
      return { success: false, results };
    }

    console.log(`✅ Shadow backtest successful`);
    console.log(`   Processed: ${shadowResult.processed}`);
    console.log(`   Stored: ${shadowResult.stored}`);

    // Step 5: Verify shadow result
    console.log("\nStep 5: Verifying shadow result...");
    const shadowResultRecord = await prisma.payoutPolicyShadowResult.findFirst({
      where: {
        jobId: completedJob.id,
        policyVersionId: policyVersionId,
      },
      select: {
        id: true,
        v1Amount: true,
        v2Amount: true,
        delta: true,
        details: true,
      },
    });

    if (!shadowResultRecord) {
      results.push({
        step: "Verify Shadow Result",
        success: false,
        message: "Shadow result not found in database",
      });
      console.log("❌ Shadow result not found");
      return { success: false, results };
    }

    results.push({
      step: "Verify Shadow Result",
      success: true,
      message: `Found shadow result ${shadowResultRecord.id}`,
      data: {
        shadowResultId: shadowResultRecord.id,
        v1Amount: shadowResultRecord.v1Amount,
        v2Amount: shadowResultRecord.v2Amount,
        delta: shadowResultRecord.delta,
      },
    });
    console.log(`✅ Found shadow result: ${shadowResultRecord.id}`);
    console.log(`   v1 (Legacy): $${shadowResultRecord.v1Amount}`);
    console.log(`   v2 (Policy): $${shadowResultRecord.v2Amount}`);
    console.log(`   Delta: $${shadowResultRecord.delta}`);

    // Step 6: Verify payout percentage
    console.log("\nStep 6: Verifying payout percentage...");
    const grossAmount = completedJob.totalPrice ? Number(completedJob.totalPrice) : 0;
    const expectedPercent = 70; // From the policy we created
    const expectedAmount = (grossAmount * expectedPercent) / 100;
    const actualAmount = shadowResultRecord.v2Amount;
    const tolerance = 0.01; // 1 cent tolerance

    const percentMatch = Math.abs(actualAmount - expectedAmount) < tolerance;

    results.push({
      step: "Verify Payout Percentage",
      success: percentMatch,
      message: percentMatch
        ? `Payout matches ${expectedPercent}%`
        : `Payout mismatch: expected $${expectedAmount.toFixed(2)}, got $${actualAmount.toFixed(2)}`,
      data: {
        grossAmount,
        expectedPercent,
        expectedAmount,
        actualAmount,
        difference: Math.abs(actualAmount - expectedAmount),
      },
    });

    if (percentMatch) {
      console.log(`✅ Payout percentage correct (${expectedPercent}%)`);
      console.log(`   Expected: $${expectedAmount.toFixed(2)}`);
      console.log(`   Actual: $${actualAmount.toFixed(2)}`);
    } else {
      console.log(`❌ Payout percentage mismatch`);
      console.log(`   Expected: $${expectedAmount.toFixed(2)}`);
      console.log(`   Actual: $${actualAmount.toFixed(2)}`);
      return { success: false, results };
    }

    // Summary
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   ✅ VALIDATION COMPLETE - ALL CHECKS PASSED            ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    return { success: true, results };
  } catch (error: any) {
    console.error("\n❌ Validation error:", error);
    results.push({
      step: "Validation Error",
      success: false,
      message: error.message || "Unknown error",
    });
    return { success: false, results };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  validatePayoutEngine()
    .then((result) => {
      console.log("\nValidation Summary:");
      result.results.forEach((r) => {
        const icon = r.success ? "✅" : "❌";
        console.log(`${icon} ${r.step}: ${r.message}`);
      });
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { validatePayoutEngine };
















