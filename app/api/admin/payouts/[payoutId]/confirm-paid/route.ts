/**
 * POST /api/admin/payouts/[payoutId]/confirm-paid
 * 
 * Admin confirms a SENT payout as PAID
 * - Only allows SENT -> PAID transition
 * - Sets paidAt = now()
 * - Audit log
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { notifyPayoutPaid } from "@/lib/notifications";
import { DEMO_MODE } from "@/lib/demoMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const payoutId = params.payoutId;

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
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    // Check if already PAID (idempotency)
    if (payout.status === "PAID") {
      return NextResponse.json({
        success: true,
        payout: {
          id: payout.id,
          status: payout.status,
          paidAt: payout.paidAt,
        },
        message: "Payout is already marked as PAID",
      });
    }

    // Only allow SENT -> PAID transition
    if (payout.status !== "SENT") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm payout as PAID. Current status is ${payout.status}. Only SENT payouts can be confirmed as PAID.`,
        },
        { status: 409 }
      );
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
        demoMode: DEMO_MODE, // Mark as demo
      },
    };

    // DEMO MODE: Update database but mark as demo (no real payment)
    if (DEMO_MODE) {
      console.log(`[DEMO_MODE] Confirming payout ${payoutId} as PAID (demo mode - no real payment)`);
      
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

        // Ensure TransactionLedger entry exists (idempotent check)
        const existingLedger = await tx.transactionLedger.findFirst({
          where: {
            referenceId: payoutId,
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

      const updated = await prisma.jobPayout.findUnique({
        where: { id: payoutId },
        select: {
          id: true,
          jobId: true,
          status: true,
          paidAt: true,
        },
      });

      // Don't send real notifications in demo mode
      console.log(`[DEMO_MODE] Payout ${payoutId} confirmed PAID (demo - notification skipped)`);

      return NextResponse.json({
        success: true,
        payout: updated,
        demoMode: true,
        message: "[DEMO MODE] Payout confirmed as PAID. No real payment processed.",
      });
    }

    // PRODUCTION: Real database update + real notifications
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
        const { randomUUID } = await import("crypto");
        await tx.transactionLedger.create({
          data: {
            id: randomUUID(),
            branchId: payout.branchId,
            transactionType: "CLEANER_PAYOUT",
            amount: payout.cleanerAmount,
            currency: payout.currency,
            description: `Payout confirmed PAID for job ${payout.jobId}`,
            referenceId: payoutId,
            referenceType: "JobPayout",
            cleanerId: payout.cleanerId,
            metadata: {
              jobId: payout.jobId,
              payoutId: payoutId,
              paidAt: paidAt.toISOString(),
            },
          },
        });
      }
    });

    const updated = await prisma.jobPayout.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        jobId: true,
        status: true,
        paidAt: true,
      },
    });

    // Audit logging
    await logAuditEntry({
      actorId: auth.userId,
      actorRole: "ADMIN",
      action: "PAYOUT_CONFIRMED_PAID",
      entityType: "JobPayout",
      entityId: payoutId,
      description: `Payout confirmed PAID for job ${payout.jobId}`,
      changes: {
        previousStatus,
        newStatus: "PAID",
        payoutId,
        jobId: payout.jobId,
        cleanerId: payout.cleanerId,
        paidAt: paidAt.toISOString(),
      },
    });

    console.log(`[CONFIRM_PAID] Payout ${payoutId} confirmed PAID by admin ${auth.userId}`);

    // Notify cleaner (non-blocking)
    notifyPayoutPaid(
      payout.cleanerId,
      payoutId,
      payout.cleanerAmount,
      payout.currency
    ).catch((err) => {
      console.error("[CONFIRM_PAID] Failed to send notification:", err);
      // Don't fail the request if notification fails
    });

    return NextResponse.json({
      success: true,
      payout: updated,
    });
  } catch (error: any) {
    console.error("[CONFIRM_PAID] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to confirm payout as paid",
      },
      { status: 500 }
    );
  }
}

