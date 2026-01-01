/**
 * W-9 Tax Onboarding: Submit Tax Profile
 * 
 * POST /api/cleaner/tax-profile/submit
 * Validates, encrypts TIN, sets status to SUBMITTED, creates audit log
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { TaxProfileStatus } from "@prisma/client";
import {
  encryptTIN,
  getTINLast4,
  validateTIN,
  maskTIN,
} from "@/lib/tax/tinEncryption";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    const body = await request.json();
    const {
      tinType,
      tin, // Plaintext TIN - will be encrypted
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
      signatureName,
    } = body;

    // Validation
    if (!tinType || !["SSN", "EIN"].includes(tinType)) {
      return NextResponse.json(
        { success: false, error: "TIN type is required and must be SSN or EIN." },
        { status: 400 }
      );
    }

    if (!tin) {
      return NextResponse.json(
        { success: false, error: "TIN is required." },
        { status: 400 }
      );
    }

    if (!validateTIN(tin, tinType)) {
      return NextResponse.json(
        { success: false, error: "Invalid TIN format." },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (!addressLine1 || !city || !state || !zipCode) {
      return NextResponse.json(
        { success: false, error: "Complete address is required." },
        { status: 400 }
      );
    }

    if (!signatureName) {
      return NextResponse.json(
        { success: false, error: "Signature name is required." },
        { status: 400 }
      );
    }

    // Encrypt TIN
    const tinEncrypted = encryptTIN(tin);
    const tinLast4 = getTINLast4(tin);
    const encryptionKeyVer = "v1"; // Version identifier for key rotation

    // Get or create profile
    const existingProfile = await prisma.cleanerTaxProfile.findUnique({
      where: { cleanerId },
    });

    // Update or create profile with encrypted TIN
    const profile = await prisma.cleanerTaxProfile.upsert({
      where: { cleanerId },
      update: {
        status: TaxProfileStatus.SUBMITTED,
        tinType,
        tinEncrypted,
        tinLast4,
        encryptionKeyVer,
        businessName: businessName || undefined,
        classification: classification || undefined,
        firstName,
        lastName,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state,
        zipCode,
        country: country || "US",
        exemptPayeeCode: exemptPayeeCode || undefined,
        exemptFatcaCode: exemptFatcaCode || undefined,
        signatureName,
        signatureDate: new Date(),
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        cleanerId,
        status: TaxProfileStatus.SUBMITTED,
        tinType,
        tinEncrypted,
        tinLast4,
        encryptionKeyVer,
        businessName: businessName || undefined,
        classification: classification || undefined,
        firstName,
        lastName,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state,
        zipCode,
        country: country || "US",
        exemptPayeeCode: exemptPayeeCode || undefined,
        exemptFatcaCode: exemptFatcaCode || undefined,
        signatureName,
        signatureDate: new Date(),
        submittedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.taxProfileAuditLog.create({
      data: {
        taxProfileId: profile.id,
        action: "SUBMITTED",
        performedBy: cleanerId,
        details: `Tax profile submitted with ${tinType} ending in ${tinLast4}`,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        status: profile.status,
        tinType: profile.tinType,
        tinLast4: maskTIN(profile.tinLast4 || "", tinType === "SSN"),
        submittedAt: profile.submittedAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[CLEANER_TAX_PROFILE_SUBMIT] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to submit tax profile",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


