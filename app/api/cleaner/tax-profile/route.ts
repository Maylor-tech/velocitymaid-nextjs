/**
 * W-9 Tax Onboarding: Cleaner Tax Profile API
 * 
 * GET /api/cleaner/tax-profile
 * Returns redacted tax profile for authenticated cleaner
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { maskTIN } from "@/lib/tax/tinEncryption";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    const profile = await prisma.cleanerTaxProfile.findUnique({
      where: { cleanerId },
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 audit log entries
        },
      },
    });

    if (!profile) {
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    // Redact sensitive data - never expose full TIN
    const redacted = {
      id: profile.id,
      cleanerId: profile.cleanerId,
      status: profile.status,
      tinType: profile.tinType,
      tinLast4: profile.tinLast4
        ? maskTIN(profile.tinLast4, profile.tinType === "SSN")
        : null,
      businessName: profile.businessName,
      classification: profile.classification,
      firstName: profile.firstName,
      lastName: profile.lastName,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zipCode,
      country: profile.country,
      exemptPayeeCode: profile.exemptPayeeCode,
      exemptFatcaCode: profile.exemptFatcaCode,
      signatureName: profile.signatureName,
      signatureDate: profile.signatureDate?.toISOString() || null,
      submittedAt: profile.submittedAt?.toISOString() || null,
      verifiedAt: profile.verifiedAt?.toISOString() || null,
      rejectedAt: profile.rejectedAt?.toISOString() || null,
      rejectionReason: profile.rejectionReason,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      auditLogs: profile.auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
        // Never expose performedBy for cleaner view
      })),
    };

    return NextResponse.json({
      success: true,
      profile: redacted,
    });
  } catch (error: any) {
    console.error("[CLEANER_TAX_PROFILE_GET] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch tax profile",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


