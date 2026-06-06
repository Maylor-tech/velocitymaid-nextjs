/**
 * Phase 3H.2: Admin 1099 Candidates API
 * 
 * GET /api/admin/1099/[year]
 * 
 * Returns 1099 candidates for a given year with threshold logic
 * - 2025: $600 threshold
 * - 2026+: $2000 threshold
 * 
 * Computes totals from PayoutTransfer where status=PAID and createdAt within year
 * Joins with CleanerTaxProfile (redacted) for W-9 status + tinLast4 + address
 * Never exposes full TIN
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";
import { maskTIN } from "@/lib/tax/tinEncryption";

/**
 * Get 1099 threshold for a given year
 */
function get1099Threshold(year: number): number {
  // 2025: $600.01 threshold (600100 cents)
  // 2026+: $2000.01 threshold (2000100 cents)
  return year === 2025 ? 600100 : 2000100; // Amounts in cents
}

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const year = parseInt(params.year, 10);
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { success: false, error: "Invalid year parameter" },
        { status: 400 }
      );
    }

    const thresholdCents = get1099Threshold(year);

    // Calculate date range for the year
    const yearStart = new Date(year, 0, 1); // January 1
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // December 31

    // Get all PAID transfers for the year
    const transfers = await prisma.payoutTransfer.findMany({
      where: {
        status: PayoutTransferStatus.PAID,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
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
    });

    // Group by cleaner and sum amounts
    const cleanerTotals = new Map<
      string,
      {
        cleanerId: string;
        cleanerName: string | null;
        cleanerEmail: string;
        totalAmountCents: number;
        transferCount: number;
      }
    >();

    for (const transfer of transfers) {
      const existing = cleanerTotals.get(transfer.cleanerId);
      if (existing) {
        existing.totalAmountCents += transfer.amountCents;
        existing.transferCount += 1;
      } else {
        cleanerTotals.set(transfer.cleanerId, {
          cleanerId: transfer.cleanerId,
          cleanerName: transfer.cleaner.name,
          cleanerEmail: transfer.cleaner.email,
          totalAmountCents: transfer.amountCents,
          transferCount: 1,
        });
      }
    }

    // Fetch tax profiles for all cleaners
    const cleanerIds = Array.from(cleanerTotals.keys());
    const taxProfiles = await prisma.cleanerTaxProfile.findMany({
      where: {
        cleanerId: { in: cleanerIds },
      },
      select: {
        cleanerId: true,
        status: true,
        tinType: true,
        tinLast4: true,
        firstName: true,
        lastName: true,
        businessName: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
      },
    });

    const taxProfileMap = new Map(
      taxProfiles.map((profile) => [profile.cleanerId, profile])
    );

    // Build candidate list (only those meeting threshold)
    const candidates = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => {
        const taxProfile = taxProfileMap.get(cleaner.cleanerId);

        return {
          cleanerId: cleaner.cleanerId,
          cleanerName: cleaner.cleanerName,
          cleanerEmail: cleaner.cleanerEmail,
          totalAmountCents: cleaner.totalAmountCents,
          totalAmount: (cleaner.totalAmountCents / 100).toFixed(2),
          transferCount: cleaner.transferCount,
          // Tax profile info (redacted)
          taxProfileStatus: taxProfile?.status || null,
          taxProfileVerified: taxProfile?.status === TaxProfileStatus.VERIFIED,
          tinType: taxProfile?.tinType || null,
          tinLast4: taxProfile?.tinLast4
            ? maskTIN(taxProfile.tinLast4, taxProfile.tinType === "SSN")
            : null,
          // Legal name: businessName if available, otherwise firstName + lastName
          legalName:
            taxProfile?.businessName ||
            (taxProfile?.firstName && taxProfile?.lastName
              ? `${taxProfile.firstName} ${taxProfile.lastName}`
              : null),
          // Address from tax profile (if available)
          addressLine1: taxProfile?.addressLine1 || null,
          addressLine2: taxProfile?.addressLine2 || null,
          city: taxProfile?.city || null,
          state: taxProfile?.state || null,
          zipCode: taxProfile?.zipCode || null,
          country: taxProfile?.country || null,
        };
      })
      .sort((a, b) => b.totalAmountCents - a.totalAmountCents); // Sort by amount descending

    // Summary statistics
    const totalCandidates = candidates.length;
    const totalAmountCents = candidates.reduce(
      (sum, c) => sum + c.totalAmountCents,
      0
    );
    const verifiedCount = candidates.filter((c) => c.taxProfileVerified).length;
    const unverifiedCount = totalCandidates - verifiedCount;

    // Phase 3H.11: Check if year is archived
    const archive = await prisma.taxYearArchive.findUnique({
      where: { year },
    });

    return NextResponse.json({
      success: true,
      year,
      threshold: thresholdCents / 100,
      summary: {
        totalCandidates,
        totalAmount: (totalAmountCents / 100).toFixed(2),
        verifiedCount,
        unverifiedCount,
      },
      candidates,
      // Phase 3H.11: Archive status
      archived: !!archive,
      archive: archive
        ? {
            archivedAt: archive.archivedAt.toISOString(),
            archivedBy: archive.archivedBy,
            readinessScore: archive.readinessScore,
            status: archive.status,
            summary: archive.summaryJson as any,
          }
        : null,
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error("[ADMIN_1099_CANDIDATES] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch 1099 candidates",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

