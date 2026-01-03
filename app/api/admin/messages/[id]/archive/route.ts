/**
 * Admin Message Archive API
 * 
 * POST /api/admin/messages/[id]/archive
 * 
 * Archives a message (sets status to ARCHIVED)
 * Never deletes records - governance-first design
 * Admin-only, protected by requireRole("ADMIN")
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { ContactMessageStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireRole(request, "ADMIN");

    // Fetch message
    const message = await prisma.contactMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    // Archive message (never delete)
    await prisma.contactMessage.update({
      where: { id: params.id },
      data: {
        status: ContactMessageStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    // Fetch updated message
    const updatedMessage = await prisma.contactMessage.findUnique({
      where: { id: params.id },
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
      message: updatedMessage,
    });
  } catch (error: any) {
    console.error("[ADMIN_MESSAGE_ARCHIVE] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    // Handle not found
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to archive message",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

