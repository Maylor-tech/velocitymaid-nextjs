/**
 * GET /api/cleaner/earnings
 * 
 * Fetch JobPayout records for the authenticated cleaner
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");

    const payouts = await prisma.jobPayout.findMany({
      where: {
        cleanerId: auth.userId,
      },
      include: {
        Job: {
          select: {
            id: true,
            serviceType: true,
            customerName: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalPending = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.cleanerAmount, 0);

    const totalApproved = payouts
      .filter((p) => p.status === "APPROVED")
      .reduce((sum, p) => sum + p.cleanerAmount, 0);

    const totalPaid = payouts
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.cleanerAmount, 0);

    return NextResponse.json({
      success: true,
      payouts: payouts.map((p) => {
        const details = (p.policyEvalDetails as any) || {};
        const paymentSettlement = details.paymentSettlement || null;
        const paidAtValue = p.paidAt?.toISOString() || paymentSettlement?.timestamp || null;

        return {
          id: p.id,
          jobId: p.jobId,
          serviceType: p.Job.serviceType,
          amount: p.cleanerAmount,
          currency: p.currency,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          paidAt: paidAtValue,
        };
      }),
      totalPending,
      totalApproved,
      totalPaid,
    });
  } catch (error: any) {
    console.error("[CLEANER_EARNINGS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch earnings",
      },
      { status: error.status || 500 }
    );
  }
}

