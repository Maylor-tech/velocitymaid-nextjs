import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cleaners/by-branch?branchId=...
 * 
 * Fetch ACTIVE cleaners for a specific branch
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        { error: "Missing required parameter: branchId" },
        { status: 400 }
      );
    }

    console.log(`[CLEANERS BY BRANCH] Fetching cleaners for branchId: ${branchId}`);

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, slug: true },
    });

    if (!branch) {
      console.log(`[CLEANERS BY BRANCH] Branch not found: ${branchId}`);
      return NextResponse.json({
        success: true,
        cleaners: [],
        count: 0,
        message: `Branch ${branchId} not found`,
      });
    }

    console.log(`[CLEANERS BY BRANCH] Branch found: ${branch.name} (${branch.slug})`);

    // Find cleaners that are:
    // 1. Role = CLEANER
    // 2. isActive = true
    // 3. Associated with the branch (via primaryBranchId or UserBranch)
    const cleaners = await prisma.user.findMany({
      where: {
        role: UserRole.CLEANER,
        isActive: true,
        OR: [
          { primaryBranchId: branchId },
          {
            UserBranch: {
              some: {
                branchId: branchId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        primaryBranchId: true,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`[CLEANERS BY BRANCH] Found ${cleaners.length} cleaners for branch ${branch.name}`);

    return NextResponse.json({
      success: true,
      cleaners: cleaners,
      count: cleaners.length,
      branchName: branch.name,
    });
  } catch (err: any) {
    console.error("[ADMIN] Fetch cleaners error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch cleaners" },
      { status: 500 }
    );
  }
}

