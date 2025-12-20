/**
 * GET /api/cleaner/payouts/[payoutId]
 * 
 * Get payout receipt for authenticated cleaner
 * Only returns payouts owned by the cleaner
 * Payment method details are masked
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const payoutId = params.payoutId;

    // Fetch payout - ensure it belongs to the cleaner
    const payout = await prisma.jobPayout.findFirst({
      where: {
        id: payoutId,
        cleanerId: auth.userId,
      },
      select: {
        id: true,
        jobId: true,
        cleanerId: true,
        branchId: true,
        grossAmount: true,
        cleanerAmount: true,
        platformFee: true,
        currency: true,
        status: true,
        paymentMethodSnapshot: true, // Already masked
        createdAt: true,
        paidAt: true,
        executedAt: true,
        executionMethod: true,
        externalReferenceId: true,
        executionNote: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    // Fetch job and branch info
    const [job, branch] = await Promise.all([
      prisma.job.findUnique({
        where: { id: payout.jobId },
        select: {
          id: true,
          customerName: true,
          serviceType: true,
          completedAt: true,
        },
      }),
      prisma.branch.findUnique({
        where: { id: payout.branchId },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      payout: {
        ...payout,
        Job: job,
        Branch: branch,
      },
    });
  } catch (error: any) {
    console.error("[CLEANER_PAYOUT_RECEIPT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch payout receipt",
      },
      { status: 500 }
    );
  }
}






