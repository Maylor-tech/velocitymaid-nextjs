/**
 * GET /api/admin/find-admin-id
 *
 * Helper endpoint to find admin user IDs.
 * Disabled in production unless ADMIN_SEED_SECRET is provided via header.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const secretKey = request.headers.get("x-admin-seed-secret");
  const expectedSecret = process.env.ADMIN_SEED_SECRET;

  if (isProduction) {
    if (!expectedSecret || secretKey !== expectedSecret) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

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
      message:
        admins.length > 0
          ? `Found ${admins.length} active admin user(s)`
          : "No active admin users found. Run scripts/setup-admin.ts locally.",
    });
  } catch (error: unknown) {
    console.error("[FIND_ADMIN_ID] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to find admin users",
      },
      { status: 500 }
    );
  }
}
