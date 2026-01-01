/**
 * W-9 Tax Onboarding: Admin Tax Profiles List
 * 
 * GET /api/admin/tax-profiles
 * Lists tax profiles with SUBMITTED status (never exposes full TIN)
 * 
 * Query params:
 * - status?: DRAFT | SUBMITTED | VERIFIED | REJECTED
 * - page?: number
 * - limit?: number
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { TaxProfileStatus } from "@prisma/client";
import { maskTIN } from "@/lib/tax/tinEncryption";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaxProfileStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && Object.values(TaxProfileStatus).includes(status)) {
      where.status = status;
    }

    // Fetch profiles with cleaner info
    const [profiles, total] = await Promise.all([
      prisma.cleanerTaxProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          submittedAt: "desc",
        },
        include: {
          cleaner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.cleanerTaxProfile.count({ where }),
    ]);

    // Redact sensitive data - never expose full TIN
    const redacted = profiles.map((profile) => ({
      id: profile.id,
      cleanerId: profile.cleanerId,
      cleanerName: profile.cleaner.name,
      cleanerEmail: profile.cleaner.email,
      status: profile.status,
      tinType: profile.tinType,
      tinLast4: profile.tinLast4
        ? maskTIN(profile.tinLast4, profile.tinType === "SSN")
        : null,
      businessName: profile.businessName,
      classification: profile.classification,
      firstName: profile.firstName,
      lastName: profile.lastName,
      city: profile.city,
      state: profile.state,
      submittedAt: profile.submittedAt?.toISOString() || null,
      verifiedAt: profile.verifiedAt?.toISOString() || null,
      rejectedAt: profile.rejectedAt?.toISOString() || null,
      rejectionReason: profile.rejectionReason,
      createdAt: profile.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      profiles: redacted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_TAX_PROFILES_LIST] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to list tax profiles",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


