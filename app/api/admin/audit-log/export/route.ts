/**
 * Read-Only Audit Log Export Endpoint
 * 
 * GET /api/admin/audit-log/export
 * 
 * Exports audit logs as CSV for compliance reviews and security audits
 * Includes tax profile actions, admin actions, and system events
 * 
 * Read-only, admin-only
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { escapeCsvField, csvRow, csvHeader, generateCsv, formatCsvDateTime } from "@/lib/csv";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const actionType = url.searchParams.get("actionType");

    // Build where clause
    const where: any = {};

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    if (actionType) {
      where.action = actionType;
    }

    // Fetch audit logs
    const auditLogs = await prisma.taxProfileAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000, // Limit to prevent memory issues
      include: {
        taxProfile: {
          select: {
            cleanerId: true,
            status: true,
          },
        },
      },
    });

    // Build CSV
    const headers = csvHeader([
      "Timestamp",
      "Action",
      "Tax Profile ID",
      "Cleaner ID",
      "Status",
      "Performed By",
      "Details",
    ]);

    const rows = auditLogs.map((log) =>
      csvRow([
        formatCsvDateTime(log.createdAt),
        escapeCsvField(log.action),
        escapeCsvField(log.taxProfileId),
        escapeCsvField(log.taxProfile.cleanerId),
        escapeCsvField(log.taxProfile.status),
        escapeCsvField(log.performedBy || "SYSTEM"),
        escapeCsvField(log.details || ""),
      ])
    );

    const csv = generateCsv(headers, rows);

    // Return CSV
    const filename = `audit-log-export-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_AUDIT_LOG_EXPORT] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to export audit log",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


