/**
 * Admin Messages API
 * 
 * GET /api/admin/messages
 * 
 * Matches V1 spec requirement
 * Delegates to contact-messages route
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    // Build where clause
    const where: any = {};
    if (status && ["NEW", "REVIEWED", "REPLIED", "ARCHIVED"].includes(status)) {
      where.status = status;
    }
    if (role) {
      where.role = role;
    }

    // Fetch messages with optional filters, ordered by most recent first
    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error("[ADMIN_MESSAGES] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch messages",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

