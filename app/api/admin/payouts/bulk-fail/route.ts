/**
 * POST /api/admin/payouts/bulk-fail
 * 
 * Admin bulk fails multiple APPROVED or SENT payouts
 * - Only allows APPROVED/SENT -> FAILED transition
 * - Validates each payout independently
 * - Does NOT wrap the whole batch in a single transaction
 * - Returns per-payout success/failure results
 * - Audit logs EACH payout separately
 * 
 * Body: {
 *   payoutIds: string[],
 *   reason?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { notifyPayoutFailed } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { payoutIds, reason } = body;

    // Validate required fields
    if (!Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "payoutIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (reason && reason.length > 500) {
      return NextResponse.json(
        { success: false, error: "reason must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Limit batch size for safety
    if (payoutIds.length > 100) {
      return NextResponse.json(
        { success: false, error: "Cannot process more than 100 payouts at once" },
        { status: 400 }
      );
    }

    // Process each payout independently (NOT in a single transaction)
    const results: Array<{
      payoutId: string;
      success: boolean;
      error?: string;
      status?: string;
    }> = [];

    for (const payoutId of payoutIds) {
      try {
        // Fetch payout
        const payout = await prisma.jobPayout.findUnique({
          where: { id: payoutId },
          select: {
            id: true,
            jobId: true,
            cleanerId: true,
            branchId: true,
            status: true,
            cleanerAmount: true,
            currency: true,
          },
        });

        if (!payout) {
          results.push({
            payoutId,
            success: false,
            error: "Payout not found",
          });
          continue;
        }

        // If already PAID, cannot fail
        if (payout.status === "PAID") {
          results.push({
            payoutId,
            success: false,
            error: "Cannot fail payout that is already PAID",
          });
          continue;
        }

        // Only allow APPROVED or SENT -> FAILED transition
        const allowedStatuses = ["APPROVED", "SENT"];
        if (!allowedStatuses.includes(payout.status)) {
          results.push({
            payoutId,
            success: false,
            error: `Invalid status: ${payout.status}. Only APPROVED or SENT payouts can be failed.`,
          });
          continue;
        }

        const previousStatus = payout.status;

        // Update payout (each in its own transaction)
        await prisma.jobPayout.update({
          where: { id: payoutId },
          data: {
            status: "FAILED",
            executionNote: reason || null,
            updatedAt: new Date(),
          },
        });

        // Audit log EACH payout separately
        await logAuditEntry({
          actorId: auth.userId,
          actorRole: "ADMIN",
          action: "PAYOUT_BULK_FAILED",
          entityType: "JobPayout",
          entityId: payoutId,
          description: `Payout bulk failed for job ${payout.jobId}`,
          changes: {
            previousStatus,
            newStatus: "FAILED",
            payoutId,
            jobId: payout.jobId,
            cleanerId: payout.cleanerId,
            failureReason: reason || null,
            bulkOperation: true,
          },
        });

        // Notify cleaner (non-blocking)
        notifyPayoutFailed(
          payout.cleanerId,
          payoutId,
          payout.cleanerAmount,
          payout.currency,
          reason || "Payout failed"
        ).catch((err) => {
          console.error(`[BULK_FAIL] Failed to send notification for payout ${payoutId}:`, err);
        });

        results.push({
          payoutId,
          success: true,
          status: "FAILED",
        });
      } catch (error: any) {
        // Individual payout failure doesn't stop the batch
        results.push({
          payoutId,
          success: false,
          error: error.message || "Failed to mark payout as failed",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[BULK_FAIL_PAYOUTS] Processed ${payoutIds.length} payouts: ${successCount} succeeded, ${failureCount} failed by admin ${auth.userId}`
    );

    return NextResponse.json({
      success: true,
      total: payoutIds.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    });
  } catch (error: any) {
    console.error("[BULK_FAIL_PAYOUTS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to bulk fail payouts",
      },
      { status: 500 }
    );
  }
}














