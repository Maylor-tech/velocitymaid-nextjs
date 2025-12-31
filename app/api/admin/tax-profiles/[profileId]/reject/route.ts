/**
 * W-9 Tax Onboarding: Admin Reject Tax Profile
 * 
 * POST /api/admin/tax-profiles/[profileId]/reject
 * Rejects a SUBMITTED tax profile (sets status to REJECTED)
 * Never exposes full TIN
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { TaxProfileStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const { profileId } = params;
    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || rejectionReason.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const profile = await prisma.cleanerTaxProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        status: true,
        cleanerId: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Tax profile not found" },
        { status: 404 }
      );
    }

    if (profile.status !== TaxProfileStatus.SUBMITTED) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reject profile in ${profile.status} status. Only SUBMITTED profiles can be rejected.`,
        },
        { status: 400 }
      );
    }

    // Update profile to REJECTED
    const updated = await prisma.cleanerTaxProfile.update({
      where: { id: profileId },
      data: {
        status: TaxProfileStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedByAdminId: auth.userId,
        rejectionReason: rejectionReason.trim(),
      },
    });

    // Create audit log
    await prisma.taxProfileAuditLog.create({
      data: {
        taxProfileId: profileId,
        action: "REJECTED",
        performedBy: auth.userId,
        details: `Tax profile rejected: ${rejectionReason.trim()}`,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        status: updated.status,
        rejectedAt: updated.rejectedAt?.toISOString(),
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_TAX_PROFILE_REJECT] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to reject tax profile",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


