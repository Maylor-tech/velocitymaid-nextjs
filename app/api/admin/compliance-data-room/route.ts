/**
 * One-Click Compliance Data Room ZIP Export (Optional)
 * 
 * GET /api/admin/compliance-data-room
 * 
 * Generates a ZIP file containing all compliance documentation:
 * - Board summary PDF
 * - Investor summary PDF
 * - Compliance process PDF
 * - Security overview PDF
 * - Audit log export CSV
 * - Analytics summary JSON
 * 
 * Read-only, admin-only
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    // For now, return a JSON response with links to all documents
    // In production, you could use a library like 'archiver' to create actual ZIP files
    // For simplicity, we'll provide a manifest of available documents

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://velocitymaid.com";

    return NextResponse.json({
      success: true,
      message: "Compliance Data Room Manifest",
      documents: [
        {
          name: "Board Summary (PDF)",
          description: "Governance-level compliance overview",
          url: `${baseUrl}/api/admin/1099/board-summary.pdf`,
          type: "pdf",
        },
        {
          name: "Investor Summary (PDF)",
          description: "High-level compliance overview for investors",
          url: `${baseUrl}/api/admin/1099/investor-summary.pdf`,
          type: "pdf",
        },
        {
          name: "Compliance Process (PDF)",
          description: "1099/W-9 workflow documentation",
          url: `${baseUrl}/api/admin/1099/compliance-process.pdf`,
          type: "pdf",
        },
        {
          name: "Security Overview (PDF)",
          description: "Security controls and data protection",
          url: `${baseUrl}/api/admin/security-overview.pdf`,
          type: "pdf",
        },
        {
          name: "Audit Log Export (CSV)",
          description: "Complete audit trail export",
          url: `${baseUrl}/api/admin/audit-log/export`,
          type: "csv",
        },
        {
          name: "Analytics Summary (JSON)",
          description: "Year-over-year compliance analytics",
          url: `${baseUrl}/api/admin/1099/analytics`,
          type: "json",
        },
      ],
      note: "Download each document individually, or use a browser extension to batch download all links.",
    });
  } catch (error: any) {
    console.error("[ADMIN_COMPLIANCE_DATA_ROOM] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate data room manifest",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


