/**
 * POST /api/cleaner/notifications/[id]/read
 * 
 * Mark a notification as read
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const notificationId = params.id;

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: auth.userId, // Ensure user owns the notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[MARK_NOTIFICATION_READ] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to mark notification as read",
      },
      { status: 500 }
    );
  }
}














