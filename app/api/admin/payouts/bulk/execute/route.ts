/**
 * POST /api/admin/payouts/bulk/execute
 * 
 * Admin bulk executes (sends) multiple APPROVED payouts
 * - Only allows APPROVED -> SENT transition
 * - Validates each payout independently
 * - Does NOT wrap the whole batch in a single transaction
 * - Returns per-payout success/failure results
 * - Audit logs EACH payout separately
 * 
 * Body: {
 *   payoutIds: string[],
 *   executionMethod: string,
 *   referencePrefix?: string, // Optional prefix for externalReferenceId
 *   note?: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { notifyPayoutSent } from "@/lib/notifications";
import { DEMO_MODE } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { payoutIds, executionMethod, referencePrefix, note } = body;

    // Validate required fields
    if (!Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "payoutIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!executionMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required field: executionMethod" },
        { status: 400 }
      );
    }

    const validMethodTypes = ["MANUAL", "ZELLE", "VENMO", "CASH", "BANK", "CASH_APP", "PAYPAL"];
    if (!validMethodTypes.includes(executionMethod)) {
      return NextResponse.json(
        { success: false, error: `Invalid executionMethod. Must be one of: ${validMethodTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate string lengths
    if (referencePrefix && referencePrefix.length > 100) {
      return NextResponse.json(
        { success: false, error: "referencePrefix must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (note && note.length > 500) {
      return NextResponse.json(
        { success: false, error: "note must be 500 characters or less" },
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

    // DEMO MODE: Update database but mark as demo (no real payment)
    if (DEMO_MODE) {
      console.log(`[DEMO_MODE] Bulk executing ${payoutIds.length} payout(s) (demo mode - no real payment)`);
      
      // Process each payout (update DB but skip real notifications)
      const results: Array<{
        payoutId: string;
        success: boolean;
        error?: string;
        status?: string;
      }> = [];

      for (const payoutId of payoutIds) {
        try {
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
              executedAt: true,
              executionMethod: true,
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

          if (payout.status === "SENT") {
            results.push({
              payoutId,
              success: true,
              status: payout.status,
            });
            continue;
          }

          if (payout.status === "PAID") {
            results.push({
              payoutId,
              success: false,
              error: "Cannot execute payout that is already PAID",
            });
            continue;
          }

          const allowedStatuses = ["APPROVED", "PENDING", "READY"];
          if (!allowedStatuses.includes(payout.status)) {
            results.push({
              payoutId,
              success: false,
              error: `Invalid status: ${payout.status}. Only APPROVED, PENDING, or READY payouts can be executed.`,
            });
            continue;
          }

          const executedAt = new Date();
          const externalReferenceId = referencePrefix 
            ? `${referencePrefix}-${payoutId.slice(-8)}`
            : null;

          await prisma.jobPayout.update({
            where: { id: payoutId },
            data: {
              status: "SENT",
              executedAt,
              executionMethod,
              externalReferenceId,
              executionNote: (note || "") + " [DEMO MODE]",
              updatedAt: new Date(),
            },
          });

          // Don't send real notifications in demo mode
          console.log(`[DEMO_MODE] Payout ${payoutId} executed (demo - notification skipped)`);

          results.push({
            payoutId,
            success: true,
            status: "SENT",
          });
        } catch (error: any) {
          results.push({
            payoutId,
            success: false,
            error: error.message || "Failed to execute payout",
          });
        }
      }

      return NextResponse.json({
        success: true,
        total: payoutIds.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
        demoMode: true,
        message: `[DEMO MODE] Bulk execution complete. No real payments processed.`,
      });
    }

    // PRODUCTION: Real database processing
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
            executedAt: true,
            executionMethod: true,
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

        // Idempotency: if already SENT, mark as success
        if (payout.status === "SENT") {
          results.push({
            payoutId,
            success: true,
            status: payout.status,
          });
          continue;
        }

        // If already PAID, mark as failure
        if (payout.status === "PAID") {
          results.push({
            payoutId,
            success: false,
            error: "Cannot execute payout that is already PAID",
          });
          continue;
        }

        // Only allow APPROVED -> SENT transition (also allow PENDING/READY for backward compatibility)
        const allowedStatuses = ["APPROVED", "PENDING", "READY"];
        if (!allowedStatuses.includes(payout.status)) {
          results.push({
            payoutId,
            success: false,
            error: `Invalid status: ${payout.status}. Only APPROVED, PENDING, or READY payouts can be executed.`,
          });
          continue;
        }

        const previousStatus = payout.status;
        const executedAt = new Date();

        // Generate externalReferenceId if prefix provided
        const externalReferenceId = referencePrefix
          ? `${referencePrefix}-${payoutId.substring(0, 8)}`
          : null;

        // Update payout (each in its own transaction)
        await prisma.jobPayout.update({
          where: { id: payoutId },
          data: {
            status: "SENT",
            executedAt,
            executionMethod,
            externalReferenceId,
            executionNote: note || null,
            updatedAt: new Date(),
          },
        });

        // Audit log EACH payout separately
        await logAuditEntry({
          actorId: auth.userId,
          actorRole: "ADMIN",
          action: "PAYOUT_BULK_EXECUTED",
          entityType: "JobPayout",
          entityId: payoutId,
          description: `Payout bulk executed for job ${payout.jobId} via ${executionMethod}`,
          changes: {
            previousStatus,
            newStatus: "SENT",
            payoutId,
            jobId: payout.jobId,
            cleanerId: payout.cleanerId,
            executionMethod,
            externalReferenceId,
            executionNote: note || null,
            executedAt: executedAt.toISOString(),
            bulkOperation: true,
          },
        });

        // Notify cleaner (non-blocking)
        notifyPayoutSent(
          payout.cleanerId,
          payoutId,
          payout.cleanerAmount,
          payout.currency,
          executionMethod
        ).catch((err) => {
          console.error(`[BULK_EXECUTE] Failed to send notification for payout ${payoutId}:`, err);
        });

        results.push({
          payoutId,
          success: true,
          status: "SENT",
        });
      } catch (error: any) {
        // Individual payout failure doesn't stop the batch
        results.push({
          payoutId,
          success: false,
          error: error.message || "Failed to execute payout",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[BULK_EXECUTE_PAYOUTS] Processed ${payoutIds.length} payouts: ${successCount} succeeded, ${failureCount} failed by admin ${auth.userId}`
    );

    return NextResponse.json({
      success: true,
      total: payoutIds.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    });
  } catch (error: any) {
    console.error("[BULK_EXECUTE_PAYOUTS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to bulk execute payouts",
      },
      { status: 500 }
    );
  }
}

