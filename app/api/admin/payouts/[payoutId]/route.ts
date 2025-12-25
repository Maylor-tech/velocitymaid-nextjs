import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payouts/[payoutId]
 * 
 * Get a single payout by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    const { payoutId } = params;

    if (!payoutId) {
      return NextResponse.json(
        {
          success: false,
          error: "payoutId is required",
        },
        { status: 400 }
      );
    }

    const payout = await prisma.jobPayout.findUnique({
      where: { id: payoutId },
      include: {
        Job: {
          select: {
            id: true,
            customerName: true,
            totalPrice: true,
            currency: true,
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json(
        {
          success: false,
          error: "Payout not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        jobId: payout.jobId,
        cleanerId: payout.cleanerId,
        branchId: payout.branchId,
        grossAmount: payout.grossAmount,
        cleanerAmount: payout.cleanerAmount,
        platformFee: payout.platformFee,
        currency: payout.currency,
        status: payout.status,
        rulesVersion: payout.rulesVersion,
        createdAt: payout.createdAt.toISOString(),
        updatedAt: payout.updatedAt.toISOString(),
        paidAt: payout.paidAt?.toISOString() || null,
        Job: payout.Job,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payout:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch payout",
      },
      { status: 500 }
    );
  }
}

















