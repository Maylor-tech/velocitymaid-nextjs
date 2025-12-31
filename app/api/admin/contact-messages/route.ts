/**
 * Admin Contact Messages API
 * 
 * GET /api/admin/contact-messages
 * 
 * Returns all contact messages
 * Admin-only, protected by requireRole("ADMIN")
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireRole(request, "ADMIN");

    // Fetch all messages with replies and internal notes, ordered by most recent first
    const messages = await prisma.contactMessage.findMany({
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
    console.error("[ADMIN_CONTACT_MESSAGES] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch contact messages",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


