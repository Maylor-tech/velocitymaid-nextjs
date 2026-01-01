/**
 * GET /api/cleaner/notifications
 * 
 * Get notifications for the authenticated cleaner
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");

    const notifications = await prisma.notification.findMany({
      where: {
        userId: auth.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error("[CLEANER_NOTIFICATIONS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}
















