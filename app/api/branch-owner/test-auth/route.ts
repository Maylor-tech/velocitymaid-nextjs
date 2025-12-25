/**
 * POST /api/branch-owner/test-auth
 * 
 * Test endpoint to set branch owner authentication cookie
 * For development/testing only
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    // Verify user exists and is a branch owner
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: UserRole.BRANCH_OWNER,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        primaryBranchId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "User not found or not a branch owner. Make sure the user has role='BRANCH_OWNER' and isActive=true" 
        },
        { status: 404 }
      );
    }

    // Check if user has branch assignment
    let branchId = user.primaryBranchId;
    if (!branchId) {
      const userBranch = await prisma.userBranch.findFirst({
        where: { userId: user.id },
        select: { branchId: true },
      });
      branchId = userBranch?.branchId || null;
    }

    if (!branchId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Branch owner not assigned to any branch. Set primaryBranchId or create a UserBranch record." 
        },
        { status: 403 }
      );
    }

    // Set authentication cookie
    const cookieStore = await cookies();
    cookieStore.set("branchOwnerId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: "Authentication cookie set successfully",
      user: {
        id: user.id,
        email: user.email,
        branchId,
      },
    });
  } catch (error: any) {
    console.error("[BRANCH_OWNER_TEST_AUTH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to set authentication cookie",
      },
      { status: 500 }
    );
  }
}










