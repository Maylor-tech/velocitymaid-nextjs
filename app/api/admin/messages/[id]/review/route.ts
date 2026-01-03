/**
 * Admin Message Review API
 * 
 * POST /api/admin/messages/[id]/review
 * 
 * Marks a message as REVIEWED if status is NEW
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

    // Only update if status is NEW
    if (message.status === ContactMessageStatus.NEW) {
      await prisma.contactMessage.update({
        where: { id: params.id },
        data: {
          status: ContactMessageStatus.REVIEWED,
          reviewedAt: new Date(),
        },
      });
    }

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
    console.error("[ADMIN_MESSAGE_REVIEW] Error:", error);

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
        error: error?.message || "Failed to review message",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

