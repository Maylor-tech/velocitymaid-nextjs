/**
 * Phase 3H.2: Admin 1099 IRIS Export
 * 
 * GET /api/admin/1099/[year]/iris.csv
 * 
 * Exports 1099 candidates in IRIS format using JSON mapping file
 * Mapping is editable per year/template from IRIS portal / Pub 5717
 * 
 * ⚠️ SECURITY: If IRIS export needs full TIN, decrypt server-side and restrict to super-admin
 * Currently only exports if tax profile is VERIFIED (has encrypted TIN)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";
import { generateCsv } from "@/lib/csv";
import { irisMapping } from "@/lib/tax/irisMapping";

/**
 * Get 1099 threshold for a given year
 */
function get1099Threshold(year: number): number {
  // 2025: $600.01 threshold (600100 cents)
  // 2026+: $2000.01 threshold (2000100 cents)
  return year === 2025 ? 600100 : 2000100; // Amounts in cents
}

/**
 * Resolve template value (simple template engine)
 */
function resolveTemplate(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    const parts = expr.trim().split("||").map((p: string) => p.trim());
    
    for (const part of parts) {
      // Handle expressions like "businessName || firstName + ' ' + lastName"
      if (part.includes("+")) {
        const addParts = part.split("+").map((p: string) => {
          const key = p.trim().replace(/['"]/g, "");
          return data[key] || key;
        });
        const result = addParts.join("");
        if (result) return result;
      } else {
        const keys = part.split(".");
        let value = data;
        for (const key of keys) {
          value = value?.[key];
        }
        if (value !== null && value !== undefined && value !== "") {
          return String(value);
        }
      }
    }
    
    return "";
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    // Option A: No full TIN in IRIS export - recipient_tin must be blank
    await requireRole(request, "ADMIN");

    const year = parseInt(params.year, 10);
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { success: false, error: "Invalid year parameter" },
        { status: 400 }
      );
    }

    // Get mapping for year (fallback to 2026+ if not found)
    const mappingKey = year === 2025 ? "2025" : "2026";
    const mapping = irisMapping[mappingKey] || irisMapping["2026"];

    if (!mapping || !mapping.columns || !mapping.mapping) {
      return NextResponse.json(
        { success: false, error: `IRIS mapping not found for year ${year}` },
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

    // Fetch tax profiles (all profiles meeting threshold, not just verified)
    // Option A: No decryption, so we don't need to restrict to verified
    const cleanerIds = Array.from(cleanerTotals.keys());
    const taxProfiles = await prisma.cleanerTaxProfile.findMany({
      where: {
        cleanerId: { in: cleanerIds },
      },
      select: {
        cleanerId: true,
        status: true,
        tinType: true,
        // Option A: Never select tinEncrypted - no decryption
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
    // Option A: No decryption - recipient_tin will be blank
    const candidates = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => {
        const taxProfile = taxProfileMap.get(cleaner.cleanerId);

        // Legal name: businessName if available, otherwise firstName + lastName
        const legalName =
          taxProfile?.businessName ||
          (taxProfile?.firstName && taxProfile?.lastName
            ? `${taxProfile.firstName} ${taxProfile.lastName}`
            : "");

        return {
          cleanerId: cleaner.cleanerId,
          cleanerName: cleaner.cleanerName || "",
          cleanerEmail: cleaner.cleanerEmail,
          totalAmountCents: cleaner.totalAmountCents,
          totalAmount: (cleaner.totalAmountCents / 100).toFixed(2),
          transferCount: cleaner.transferCount,
          tinType: taxProfile?.tinType || "",
          // Option A: recipient_tin must be blank - never decrypt
          tin: "", // Always blank for Option A
          legalName,
          addressLine1: taxProfile?.addressLine1 || "",
          addressLine2: taxProfile?.addressLine2 || "",
          city: taxProfile?.city || "",
          state: taxProfile?.state || "",
          zipCode: taxProfile?.zipCode || "",
          country: taxProfile?.country || "US",
          year: year.toString(),
        };
      })
      .sort((a, b) => b.totalAmountCents - a.totalAmountCents);

    // Build IRIS CSV using mapping
    const headers = mapping.columns;
    const rows = candidates.map((candidate) => {
      return headers.map((header: string) => {
        const template = mapping.mapping[header];
        if (!template) return "";

        // Handle literal values
        if (!template.includes("{{")) {
          return template;
        }

        // Resolve template
        return resolveTemplate(template, candidate);
      });
    });

    // Generate CSV
    const csvContent = generateCsv(headers, rows);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="1099-iris-${year}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_1099_IRIS_EXPORT] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export IRIS 1099",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

