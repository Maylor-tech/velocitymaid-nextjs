/**
 * POST /api/admin/seed/admin
 *
 * Creates a test admin user for development/testing.
 * In production: requires ADMIN_SEED_SECRET via x-admin-seed-secret header.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const secretKey = request.headers.get("x-admin-seed-secret");
  const expectedSecret = process.env.ADMIN_SEED_SECRET;

  if (isProduction) {
    if (!expectedSecret || secretKey !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
  }

  const seedEmail =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@test.com";
  const seedName = process.env.ADMIN_NAME?.trim() || "Test Admin";

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        email: seedEmail,
      },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name,
        },
      });
    }

    const admin = await prisma.user.create({
      data: {
        id: `admin-test-${Date.now()}`,
        email: seedEmail,
        name: seedName,
        role: UserRole.ADMIN,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error: unknown) {
    console.error("[CREATE_ADMIN] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create admin user",
      },
      { status: 500 }
    );
  }
}
