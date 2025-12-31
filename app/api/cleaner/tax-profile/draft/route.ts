/**
 * W-9 Tax Onboarding: Save Draft Tax Profile
 * 
 * POST /api/cleaner/tax-profile/draft
 * Saves draft tax profile (does not encrypt TIN yet, does not submit)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { TaxProfileStatus, TaxIdentificationType, TaxClassification } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    const body = await request.json();
    const {
      tinType,
      tin, // Plaintext TIN (will be encrypted on submit, not here)
      businessName,
      classification,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      exemptPayeeCode,
      exemptFatcaCode,
    } = body;

    // Validation (basic - full validation on submit)
    if (tinType && !["SSN", "EIN"].includes(tinType)) {
      return NextResponse.json(
        { success: false, error: "Invalid TIN type. Must be SSN or EIN." },
        { status: 400 }
      );
    }

    // Upsert draft profile
    const profile = await prisma.cleanerTaxProfile.upsert({
      where: { cleanerId },
      update: {
        status: TaxProfileStatus.DRAFT,
        tinType: tinType || undefined,
        // Do NOT store TIN in draft - only on submit
        businessName: businessName || undefined,
        classification: classification || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country: country || "US",
        exemptPayeeCode: exemptPayeeCode || undefined,
        exemptFatcaCode: exemptFatcaCode || undefined,
        updatedAt: new Date(),
      },
      create: {
        cleanerId,
        status: TaxProfileStatus.DRAFT,
        tinType: tinType || undefined,
        businessName: businessName || undefined,
        classification: classification || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        addressLine1: addressLine1 || undefined,
        addressLine2: addressLine2 || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country: country || "US",
        exemptPayeeCode: exemptPayeeCode || undefined,
        exemptFatcaCode: exemptFatcaCode || undefined,
      },
    });

    // Create audit log
    await prisma.taxProfileAuditLog.create({
      data: {
        taxProfileId: profile.id,
        action: "DRAFT_SAVED",
        performedBy: cleanerId,
        details: "Draft tax profile saved",
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        status: profile.status,
        tinType: profile.tinType,
        // Never return TIN in response
      },
    });
  } catch (error: any) {
    console.error("[CLEANER_TAX_PROFILE_DRAFT] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to save draft tax profile",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


