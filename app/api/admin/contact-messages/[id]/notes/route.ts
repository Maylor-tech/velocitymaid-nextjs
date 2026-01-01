/**
 * Admin Contact Internal Notes API
 * 
 * POST /api/admin/contact-messages/[id]/notes
 * 
 * Creates an internal note (not emailed) for a contact message
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
    await requireRole(request, "ADMIN");

    const body = await request.json();
    const { body: noteBody } = body;

    if (!noteBody || typeof noteBody !== "string" || noteBody.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Note body is required" },
        { status: 400 }
      );
    }

    // Verify contact message exists
    const contact = await prisma.contactMessage.findUnique({
      where: { id: params.id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact message not found" },
        { status: 404 }
      );
    }

    // Create internal note
    await prisma.contactInternalNote.create({
      data: {
        contactMessageId: params.id,
        body: noteBody.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CONTACT_INTERNAL_NOTE] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create internal note",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

