/**
 * POST /api/admin/seed/admin
 * 
 * Creates a test admin user for development/testing
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        email: "admin@test.com",
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

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        id: `admin-test-${Date.now()}`,
        email: "admin@test.com",
        name: "Test Admin",
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
  } catch (error: any) {
    console.error("[CREATE_ADMIN] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create admin user",
      },
      { status: 500 }
    );
  }
}















