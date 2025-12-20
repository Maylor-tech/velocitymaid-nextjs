/**
 * POST /api/admin/payouts/bulk/confirm-paid
 * 
 * Admin bulk confirms multiple SENT payouts as PAID
 * - Only allows SENT -> PAID transition
 * - Validates each payout independently
 * - Does NOT wrap the whole batch in a single transaction
 * - Returns per-payout success/failure results
 * - Audit logs EACH payout separately
 * 
 * Body: {
 *   payoutIds: string[]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { notifyPayoutPaid } from "@/lib/notifications";
import { randomUUID } from "crypto";
import { DEMO_MODE } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");

    const body = await request.json().catch(() => ({}));
    const { payoutIds } = body;

    // Validate required fields
    if (!Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "payoutIds must be a non-empty array" },
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
      console.log(`[DEMO_MODE] Bulk confirming ${payoutIds.length} payout(s) as PAID (demo mode - no real payment)`);
      
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
              paidAt: true,
              policyEvalDetails: true,
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

          if (payout.status === "PAID") {
            results.push({
              payoutId,
              success: true,
              status: payout.status,
            });
            continue;
          }

          if (payout.status !== "SENT") {
            results.push({
              payoutId,
              success: false,
              error: `Invalid status: ${payout.status}. Only SENT payouts can be confirmed as PAID.`,
            });
            continue;
          }

          const paidAt = new Date();
          const existingDetails = (payout.policyEvalDetails as any) || {};

          const updatedDetails = {
            ...existingDetails,
            paymentSettlement: {
              ...existingDetails.paymentSettlement,
              confirmedAt: paidAt.toISOString(),
              adminId: auth.userId,
              demoMode: true,
            },
          };

          await prisma.$transaction(async (tx) => {
            await tx.jobPayout.update({
              where: { id: payoutId },
              data: {
                status: "PAID",
                paidAt,
                policyEvalDetails: updatedDetails,
                updatedAt: new Date(),
              },
            });

            const existingLedger = await tx.transactionLedger.findFirst({
              where: {
                referenceId: payoutId,
                referenceType: "JobPayout",
              },
            });

            if (!existingLedger) {
              await tx.transactionLedger.create({
                data: {
                  id: randomUUID(),
                  branchId: payout.branchId,
                  transactionType: "CLEANER_PAYOUT",
                  amount: payout.cleanerAmount,
                  currency: payout.currency,
                  description: `Payout confirmed PAID for job ${payout.jobId} [DEMO]`,
                  referenceId: payoutId,
                  referenceType: "JobPayout",
                  cleanerId: payout.cleanerId,
                  metadata: {
                    jobId: payout.jobId,
                    payoutId: payoutId,
                    paidAt: paidAt.toISOString(),
                    demoMode: true,
                  },
                },
              });
            }
          });

          // Don't send real notifications in demo mode
          console.log(`[DEMO_MODE] Payout ${payoutId} confirmed PAID (demo - notification skipped)`);

          results.push({
            payoutId,
            success: true,
            status: "PAID",
          });
        } catch (error: any) {
          results.push({
            payoutId,
            success: false,
            error: error.message || "Failed to confirm payout as paid",
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
        message: `[DEMO MODE] Bulk confirmation complete. No real payments processed.`,
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
            paidAt: true,
            policyEvalDetails: true,
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

        // Idempotency: if already PAID, mark as success
        if (payout.status === "PAID") {
          results.push({
            payoutId,
            success: true,
            status: payout.status,
          });
          continue;
        }

        // Only allow SENT -> PAID transition
        if (payout.status !== "SENT") {
          results.push({
            payoutId,
            success: false,
            error: `Invalid status: ${payout.status}. Only SENT payouts can be confirmed as PAID.`,
          });
          continue;
        }

        const previousStatus = payout.status;
        const paidAt = new Date();
        const existingDetails = (payout.policyEvalDetails as any) || {};

        // Update settlement metadata if needed
        const updatedDetails = {
          ...existingDetails,
          paymentSettlement: {
            ...existingDetails.paymentSettlement,
            confirmedAt: paidAt.toISOString(),
            adminId: auth.userId,
          },
        };

        // Update payout (each in its own transaction)
        await prisma.$transaction(async (tx) => {
          // Update payout status and paidAt
          await tx.jobPayout.update({
            where: { id: payoutId },
            data: {
              status: "PAID",
              paidAt,
              policyEvalDetails: updatedDetails,
              updatedAt: new Date(),
            },
          });

          // Ensure TransactionLedger entry exists (idempotent check)
          const existingLedger = await tx.transactionLedger.findFirst({
            where: {
              referenceId: payoutId,
              referenceType: "JobPayout",
            },
          });

          if (!existingLedger) {
            await tx.transactionLedger.create({
              data: {
                id: randomUUID(),
                branchId: payout.branchId,
                transactionType: "CLEANER_PAYOUT",
                amount: payout.cleanerAmount,
                currency: payout.currency,
                description: `Payout bulk confirmed PAID for job ${payout.jobId}`,
                referenceId: payoutId,
                referenceType: "JobPayout",
                cleanerId: payout.cleanerId,
                metadata: {
                  jobId: payout.jobId,
                  payoutId: payoutId,
                  paidAt: paidAt.toISOString(),
                  bulkOperation: true,
                },
              },
            });
          }
        });

        // Audit log EACH payout separately
        await logAuditEntry({
          actorId: auth.userId,
          actorRole: "ADMIN",
          action: "PAYOUT_BULK_CONFIRMED_PAID",
          entityType: "JobPayout",
          entityId: payoutId,
          description: `Payout bulk confirmed PAID for job ${payout.jobId}`,
          changes: {
            previousStatus,
            newStatus: "PAID",
            payoutId,
            jobId: payout.jobId,
            cleanerId: payout.cleanerId,
            paidAt: paidAt.toISOString(),
            bulkOperation: true,
          },
        });

        // Notify cleaner (non-blocking)
        notifyPayoutPaid(
          payout.cleanerId,
          payoutId,
          payout.cleanerAmount,
          payout.currency
        ).catch((err) => {
          console.error(`[BULK_CONFIRM_PAID] Failed to send notification for payout ${payoutId}:`, err);
        });

        results.push({
          payoutId,
          success: true,
          status: "PAID",
        });
      } catch (error: any) {
        // Individual payout failure doesn't stop the batch
        results.push({
          payoutId,
          success: false,
          error: error.message || "Failed to confirm payout as paid",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[BULK_CONFIRM_PAID] Processed ${payoutIds.length} payouts: ${successCount} succeeded, ${failureCount} failed by admin ${auth.userId}`
    );

    return NextResponse.json({
      success: true,
      total: payoutIds.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    });
  } catch (error: any) {
    console.error("[BULK_CONFIRM_PAID] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to bulk confirm payouts as paid",
      },
      { status: 500 }
    );
  }
}

