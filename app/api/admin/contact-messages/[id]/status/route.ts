/**
 * Admin Contact Message Status API
 * 
 * POST /api/admin/contact-messages/[id]/status
 * 
 * Updates the status of a contact message
 * Admin-only, protected by requireRole("ADMIN")
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireRole(request, "ADMIN");

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!["NEW", "REVIEWED", "REPLIED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update message status
    await prisma.contactMessage.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_CONTACT_STATUS] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    // Handle not found
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Contact message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update contact message status",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

