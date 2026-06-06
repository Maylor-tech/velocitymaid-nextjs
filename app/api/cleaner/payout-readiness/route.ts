/**
 * GET /api/cleaner/payout-readiness
 * 
 * Returns cleaner's payout eligibility status with human-readable blockers
 * Used by /cleaner/earnings page to show "Why I can't get paid yet"
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { hasVerifiedPaymentMethod } from "@/lib/paymentMethods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    // 1. Check payment method status
    const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
      where: { cleanerId },
      orderBy: { createdAt: "desc" },
    });

    const paymentMethodStatus = {
      exists: !!paymentMethod,
      verified: !!(paymentMethod?.isActive && paymentMethod?.verifiedAt),
      status: !paymentMethod
        ? "none"
        : !paymentMethod.isActive && paymentMethod.verificationNote
        ? "rejected"
        : paymentMethod.isActive && !paymentMethod.verifiedAt
        ? "pending"
        : "verified",
    };

    // 2. Count completed jobs without payouts
    const completedJobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        totalPrice: true,
      },
    });

    // Check which jobs already have payouts
    const jobIds = completedJobs.map((j) => j.id);
    const existingPayouts = await prisma.jobPayout.findMany({
      where: {
        jobId: { in: jobIds },
      },
      select: {
        jobId: true,
      },
    });

    const jobsWithPayouts = new Set(existingPayouts.map((p) => p.jobId));
    const jobsReadyForPayout = completedJobs.filter(
      (j) => !jobsWithPayouts.has(j.id) && j.totalPrice && Number(j.totalPrice) > 0
    );

    // 3. Count pending payouts (PENDING, APPROVED, READY statuses)
    const pendingPayouts = await prisma.jobPayout.count({
      where: {
        cleanerId,
        status: { in: ["PENDING", "APPROVED", "READY"] },
      },
    });

    // 4. Check cleaner is active
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId },
      select: { isActive: true },
    });

    // 5. Build blockers array with human-readable reasons
    const blockers: Array<{
      reason: string;
      action: string;
      link?: string;
      severity: "error" | "warning" | "info";
    }> = [];

    // Check cleaner is active
    if (!cleaner?.isActive) {
      blockers.push({
        reason: "Your account is not active",
        action: "Contact support to activate your account",
        severity: "error",
      });
    }

    // Check payment method
    if (!paymentMethodStatus.exists) {
      blockers.push({
        reason: "No payment method on file",
        action: "Add a payment method to receive payouts",
        link: "/cleaner/payments",
        severity: "error",
      });
    } else if (!paymentMethodStatus.verified) {
      if (paymentMethodStatus.status === "rejected") {
        blockers.push({
          reason: "Payment method was rejected",
          action: "Update your payment method and wait for verification",
          link: "/cleaner/payments",
          severity: "error",
        });
      } else {
        blockers.push({
          reason: "Payment method pending verification",
          action: "Wait for admin verification (usually within 24 hours)",
          link: "/cleaner/payments",
          severity: "warning",
        });
      }
    }

    // Check for completed jobs
    if (jobsReadyForPayout.length === 0 && completedJobs.length === 0) {
      blockers.push({
        reason: "No completed jobs yet",
        action: "Complete jobs to generate payouts",
        severity: "warning",
      });
    } else if (jobsReadyForPayout.length === 0 && completedJobs.length > 0) {
      blockers.push({
        reason: "All completed jobs already have payouts",
        action: "Complete more jobs to generate new payouts",
        severity: "info",
      });
    }

    // Eligible if no blockers and has jobs ready for payout
    const eligible =
      blockers.length === 0 &&
      jobsReadyForPayout.length > 0 &&
      paymentMethodStatus.verified &&
      cleaner?.isActive;

    return NextResponse.json({
      success: true,
      readiness: {
        eligible,
        blockers,
        paymentMethod: paymentMethodStatus,
        completedJobs: completedJobs.length,
        jobsReadyForPayout: jobsReadyForPayout.length,
        pendingPayouts,
        cleanerActive: cleaner?.isActive ?? false,
      },
    });
  } catch (error: any) {
    // If it's a NextResponse (from requireRole), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    console.error("[PAYOUT_READINESS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch payout readiness",
      },
      { status: 500 }
    );
  }
}

