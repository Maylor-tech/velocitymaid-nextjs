/**
 * W-9 Tax Onboarding: Admin Verify Tax Profile
 * 
 * POST /api/admin/tax-profiles/[profileId]/verify
 * Verifies a SUBMITTED tax profile (sets status to VERIFIED)
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
          error: `Cannot verify profile in ${profile.status} status. Only SUBMITTED profiles can be verified.`,
        },
        { status: 400 }
      );
    }

    // Update profile to VERIFIED
    const updated = await prisma.cleanerTaxProfile.update({
      where: { id: profileId },
      data: {
        status: TaxProfileStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedByAdminId: auth.userId,
      },
    });

    // Create audit log
    await prisma.taxProfileAuditLog.create({
      data: {
        taxProfileId: profileId,
        action: "VERIFIED",
        performedBy: auth.userId,
        details: "Tax profile verified by admin",
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        status: updated.status,
        verifiedAt: updated.verifiedAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_TAX_PROFILE_VERIFY] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to verify tax profile",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


