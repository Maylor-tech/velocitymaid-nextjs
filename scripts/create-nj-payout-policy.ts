/**
 * Create Payout Policy for New Jersey Branch
 * 
 * Usage:
 *   npx tsx scripts/create-nj-payout-policy.ts
 * 
 * Or run via API:
 *   POST /api/admin/scripts/create-nj-payout-policy
 */

import { prisma } from "../lib/prisma";

async function createNJPayoutPolicy() {
  try {
    console.log("[CREATE_PAYOUT_POLICY] Starting...");

    // Step 1: Find the New Jersey branch
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { slug: "new-jersey" },
          { slug: "new_jersey" },
          { name: { contains: "New Jersey", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!branch) {
      console.error("[CREATE_PAYOUT_POLICY] New Jersey branch not found!");
      return {
        success: false,
        error: "New Jersey branch not found",
      };
    }

    console.log(`[CREATE_PAYOUT_POLICY] Found branch: ${branch.name} (${branch.id})`);

    // Step 2: Check if a policy already exists for this branch
    const existingAssignment = await prisma.payoutPolicyAssignment.findFirst({
      where: {
        branchId: branch.id,
        effectiveTo: null, // Active assignment
      },
      include: {
        PolicyVersion: true,
      },
    });

    if (existingAssignment) {
      console.log(
        `[CREATE_PAYOUT_POLICY] Policy already exists: ${existingAssignment.PolicyVersion.name} (${existingAssignment.policyVersionId})`
      );
      return {
        success: false,
        error: "Policy already exists for this branch",
        policyVersionId: existingAssignment.policyVersionId,
        assignmentId: existingAssignment.id,
      };
    }

    // Step 3: Create PayoutPolicyVersion
    const policyVersion = await prisma.payoutPolicyVersion.create({
      data: {
        name: `New Jersey Payout Policy - ${new Date().toISOString().split("T")[0]}`,
        description: "Default payout policy for New Jersey branch: 55% cleaner, 45% platform",
        status: "published",
        publishedAt: new Date(),
      },
    });

    console.log(`[CREATE_PAYOUT_POLICY] Created policy version: ${policyVersion.id}`);

    // Step 4: Create a simple rule for the policy
    // Rule structure must match PayoutRule schema from services/payout/ruleSchema.ts
    const rule = await prisma.payoutPolicyRule.create({
      data: {
        policyVersionId: policyVersion.id,
        priority: 1,
        isActive: true,
        rule: {
          name: "Base 55% Payout",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 55,
            },
            {
              type: "rounding",
              mode: "nearest_cent",
            },
          ],
        },
      },
    });

    console.log(`[CREATE_PAYOUT_POLICY] Created rule: ${rule.id}`);

    // Step 5: Create PayoutPolicyAssignment to link policy to branch
    const assignment = await prisma.payoutPolicyAssignment.create({
      data: {
        branchId: branch.id,
        policyVersionId: policyVersion.id,
        effectiveFrom: new Date(),
        effectiveTo: null, // Active indefinitely
      },
    });

    console.log(`[CREATE_PAYOUT_POLICY] Created assignment: ${assignment.id}`);

    console.log(`[CREATE_PAYOUT_POLICY] ✅ Success!`);
    console.log(`  Policy Version: ${policyVersion.id}`);
    console.log(`  Branch: ${branch.name} (${branch.id})`);
    console.log(`  Assignment: ${assignment.id}`);
    console.log(`  Effective From: ${assignment.effectiveFrom.toISOString()}`);

    return {
      success: true,
      policyVersionId: policyVersion.id,
      branchId: branch.id,
      assignmentId: assignment.id,
      ruleId: rule.id,
      message: `Payout policy created for ${branch.name}`,
    };
  } catch (error: any) {
    console.error("[CREATE_PAYOUT_POLICY] Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  createNJPayoutPolicy()
    .then((result) => {
      console.log("\n[CREATE_PAYOUT_POLICY] Result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("[CREATE_PAYOUT_POLICY] Fatal error:", error);
      process.exit(1);
    });
}

export { createNJPayoutPolicy };

