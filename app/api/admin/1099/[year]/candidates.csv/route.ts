/**
 * Phase 3H.2: Admin 1099 Candidates CSV Export
 * 
 * GET /api/admin/1099/[year]/candidates.csv
 * 
 * Exports 1099 candidates as CSV (canonical stable format)
 * Never exposes full TIN
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";
import { generateCsv, formatCsvDate, formatCsvCurrency } from "@/lib/csv";
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
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

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

    // Fetch tax profiles
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
          cleanerName: cleaner.cleanerName || "",
          cleanerEmail: cleaner.cleanerEmail,
          totalAmountCents: cleaner.totalAmountCents,
          transferCount: cleaner.transferCount,
          taxProfileStatus: taxProfile?.status || "NONE",
          taxProfileVerified: taxProfile?.status === TaxProfileStatus.VERIFIED,
          tinType: taxProfile?.tinType || "",
          tinLast4: taxProfile?.tinLast4
            ? maskTIN(taxProfile.tinLast4, taxProfile.tinType === "SSN")
            : "",
          // Legal name: businessName if available, otherwise firstName + lastName
          legalName:
            taxProfile?.businessName ||
            (taxProfile?.firstName && taxProfile?.lastName
              ? `${taxProfile.firstName} ${taxProfile.lastName}`
              : ""),
          addressLine1: taxProfile?.addressLine1 || "",
          addressLine2: taxProfile?.addressLine2 || "",
          city: taxProfile?.city || "",
          state: taxProfile?.state || "",
          zipCode: taxProfile?.zipCode || "",
          country: taxProfile?.country || "US",
        };
      })
      .sort((a, b) => b.totalAmountCents - a.totalAmountCents);

    // CSV Headers (canonical stable format)
    const headers = [
      "Cleaner ID",
      "Cleaner Name",
      "Cleaner Email",
      "Total Amount (USD)",
      "Transfer Count",
      "Tax Profile Status",
      "Tax Profile Verified",
      "TIN Type",
      "TIN Last 4 (Masked)",
      "Legal Name",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "ZIP Code",
      "Country",
    ];

    // CSV Rows
    const rows = candidates.map((candidate) => [
      candidate.cleanerId,
      candidate.cleanerName,
      candidate.cleanerEmail,
      formatCsvCurrency(candidate.totalAmountCents / 100),
      candidate.transferCount.toString(),
      candidate.taxProfileStatus,
      candidate.taxProfileVerified ? "Yes" : "No",
      candidate.tinType,
      candidate.tinLast4,
      candidate.legalName,
      candidate.addressLine1,
      candidate.addressLine2,
      candidate.city,
      candidate.state,
      candidate.zipCode,
      candidate.country,
    ]);

    // Generate CSV
    const csvContent = generateCsv(headers, rows);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="1099-candidates-${year}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_1099_CSV_EXPORT] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export 1099 candidates",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

