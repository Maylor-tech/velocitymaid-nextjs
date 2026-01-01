/**
 * Admin Investor Access Requests API
 * 
 * GET /api/admin/investors/requests
 * 
 * Returns all investor access requests
 * Admin-only, protected by requireRole("ADMIN")
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireRole(request, "ADMIN");

    // Fetch all requests, ordered by most recent first
    const requests = await prisma.investorAccessRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error("[ADMIN_INVESTOR_REQUESTS] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch investor requests",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


