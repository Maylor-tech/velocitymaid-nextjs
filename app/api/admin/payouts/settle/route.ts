/**
 * POST /api/admin/payouts/settle
 * 
 * Admin settles multiple pending payouts as PAID
 * - Accepts array of payoutIds
 * - Updates JobPayout: status = PAID, paidAt = now(), admin tracking
 * - Updates related Job records: payoutStatus = PAID
 * - Uses database transaction
 * - Returns settled count + timestamp
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { notifyPayoutPaid } from "@/lib/notifications";
import { DEMO_MODE } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const body = await request.json();
    const { payoutIds } = body;

    // Validate input
    if (!Array.isArray(payoutIds) || payoutIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "payoutIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch all payouts to validate and get jobIds
    const payouts = await prisma.jobPayout.findMany({
      where: {
        id: { in: payoutIds },
      },
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

    if (payouts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No payouts found" },
        { status: 404 }
      );
    }

    // Filter to only PENDING payouts (allow settling pending payouts)
    const eligiblePayouts = payouts.filter((p) => p.status === "PENDING");
    
    if (eligiblePayouts.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No eligible payouts found. Only PENDING payouts can be settled." 
        },
        { status: 400 }
      );
    }

    const paidAt = new Date();
    const settledPayoutIds: string[] = [];
    const jobIds: string[] = [];

    // DEMO MODE: Update database but mark as demo (no real payment)
    if (DEMO_MODE) {
      console.log(`[DEMO_MODE] Settling ${eligiblePayouts.length} payout(s) (demo mode - no real payment)`);
      
      await prisma.$transaction(async (tx) => {
        for (const payout of eligiblePayouts) {
          const existingDetails = (payout.policyEvalDetails as any) || {};

          const updatedDetails = {
            ...existingDetails,
            paymentSettlement: {
              ...existingDetails.paymentSettlement,
              settledAt: paidAt.toISOString(),
              adminId: auth.userId,
              demoMode: true,
            },
          };

          await tx.jobPayout.update({
            where: { id: payout.id },
            data: {
              status: "PAID",
              paidAt,
              policyEvalDetails: updatedDetails,
              updatedAt: new Date(),
            },
          });

          settledPayoutIds.push(payout.id);
          jobIds.push(payout.jobId);
        }

        if (jobIds.length > 0) {
          await tx.job.updateMany({
            where: {
              id: { in: jobIds },
            },
            data: {
              payoutStatus: "PAID",
            },
          });
        }
      });

      console.log(`[DEMO_MODE] Settled ${settledPayoutIds.length} payout(s) (demo - notifications skipped)`);

      return NextResponse.json({
        success: true,
        settledCount: settledPayoutIds.length,
        settledAt: paidAt.toISOString(),
        payoutIds: settledPayoutIds,
        demoMode: true,
        message: `[DEMO MODE] Settled ${settledPayoutIds.length} payout(s). No real payments processed.`,
      });
    }

    // PRODUCTION: Real database transaction
    // Process all eligible payouts in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const payout of eligiblePayouts) {
        const existingDetails = (payout.policyEvalDetails as any) || {};

        // Update settlement metadata
        const updatedDetails = {
          ...existingDetails,
          paymentSettlement: {
            ...existingDetails.paymentSettlement,
            settledAt: paidAt.toISOString(),
            adminId: auth.userId,
          },
        };

        // Update JobPayout
        await tx.jobPayout.update({
          where: { id: payout.id },
          data: {
            status: "PAID",
            paidAt,
            policyEvalDetails: updatedDetails,
            updatedAt: new Date(),
          },
        });

        settledPayoutIds.push(payout.id);
        jobIds.push(payout.jobId);

        // Ensure TransactionLedger entry exists (idempotent check)
        const existingLedger = await tx.transactionLedger.findFirst({
          where: {
            referenceId: payout.id,
            referenceType: "JobPayout",
          },
        });

        if (!existingLedger) {
          const { randomUUID } = await import("crypto");
          await tx.transactionLedger.create({
            data: {
              id: randomUUID(),
              branchId: payout.branchId,
              transactionType: "CLEANER_PAYOUT",
              amount: payout.cleanerAmount,
              currency: payout.currency,
              description: `Payout settled PAID for job ${payout.jobId}`,
              referenceId: payout.id,
              referenceType: "JobPayout",
              cleanerId: payout.cleanerId,
              metadata: {
                jobId: payout.jobId,
                payoutId: payout.id,
                paidAt: paidAt.toISOString(),
                settledBy: auth.userId,
              },
            },
          });
        }
      }

      // Update related Job records: payoutStatus = PAID
      if (jobIds.length > 0) {
        await tx.job.updateMany({
          where: {
            id: { in: jobIds },
          },
          data: {
            payoutStatus: "PAID",
          },
        });
      }
    });

    // Audit logging for each settled payout
    for (const payout of eligiblePayouts) {
      await logAuditEntry({
        actorId: auth.userId,
        actorRole: "ADMIN",
        action: "PAYOUT_SETTLED",
        entityType: "JobPayout",
        entityId: payout.id,
        description: `Payout settled PAID for job ${payout.jobId}`,
        changes: {
          previousStatus: payout.status,
          newStatus: "PAID",
          payoutId: payout.id,
          jobId: payout.jobId,
          cleanerId: payout.cleanerId,
          paidAt: paidAt.toISOString(),
        },
      }).catch((err) => {
        console.error(`[SETTLE] Failed to log audit for payout ${payout.id}:`, err);
      });
    }

    // Notify cleaners (non-blocking)
    for (const payout of eligiblePayouts) {
      notifyPayoutPaid(
        payout.cleanerId,
        payout.id,
        payout.cleanerAmount,
        payout.currency
      ).catch((err) => {
        console.error(`[SETTLE] Failed to send notification for payout ${payout.id}:`, err);
      });
    }

    console.log(
      `[SETTLE] Settled ${settledPayoutIds.length} payout(s) by admin ${auth.userId}`
    );

    return NextResponse.json({
      success: true,
      settledCount: settledPayoutIds.length,
      settledAt: paidAt.toISOString(),
      payoutIds: settledPayoutIds,
    });
  } catch (error: any) {
    console.error("[SETTLE] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to settle payouts",
      },
      { status: 500 }
    );
  }
}

