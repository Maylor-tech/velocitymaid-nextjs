/**
 * GET /api/admin/find-admin-id
 * 
 * Helper endpoint to find admin user IDs (no auth required for development)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      admins,
      message: admins.length > 0 
        ? `Found ${admins.length} active admin user(s)` 
        : "No active admin users found. Create one using POST /api/admin/seed/admin",
    });
  } catch (error: any) {
    console.error("[FIND_ADMIN_ID] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to find admin users",
      },
      { status: 500 }
    );
  }
}
















