/**
 * Policy Selection Helper
 * 
 * Finds the active published policy version for a branch at a given point in time.
 */

import { prisma } from "@/lib/prisma";

/**
 * Get the active policy version ID for a branch at a specific date/time
 * 
 * @param branchId - Branch ID
 * @param at - Point in time to check (defaults to now)
 * @returns Policy version ID or null if no active policy found
 */
export async function getActivePolicyVersionIdForBranch(
  branchId: string,
  at: Date = new Date()
): Promise<string | null> {
  try {
    // Find active assignment for this branch
    const assignment = await prisma.payoutPolicyAssignment.findFirst({
      where: {
        branchId: branchId,
        effectiveFrom: {
          lte: at,
        },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gt: at } },
        ],
      },
      include: {
        PolicyVersion: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        effectiveFrom: "desc", // Most recent assignment first
      },
    });

    if (!assignment) {
      return null;
    }

    // Ensure policy version is published
    if (assignment.PolicyVersion.status !== "published") {
      return null;
    }

    return assignment.policyVersionId;
  } catch (error: any) {
    console.error(
      `[POLICY_SELECTION] Error finding policy for branch ${branchId}:`,
      error
    );
    return null;
  }
}















