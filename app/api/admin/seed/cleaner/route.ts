import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { UserRole, BranchStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/seed/cleaner
 * 
 * Seed an ACTIVE cleaner for New Jersey branch
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    // Find or create New Jersey branch
    let njBranch = await prisma.branch.findUnique({
      where: { slug: "new-jersey" },
      select: { id: true, name: true, slug: true },
    });

    if (!njBranch) {
      // Try to find by name
      njBranch = await prisma.branch.findFirst({
        where: {
          OR: [
            { name: { contains: "Jersey", mode: "insensitive" } },
            { slug: { contains: "jersey", mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, slug: true },
      });

      if (!njBranch) {
        // Create New Jersey branch if it doesn't exist
        const newBranch = await prisma.branch.create({
          data: {
            id: `branch-nj-${Date.now()}`,
            name: "New Jersey",
            slug: "new-jersey",
            country: "US",
            state: "New Jersey",
            city: "Newark",
            regionLabel: "New Jersey",
            timezone: "America/New_York",
            primaryPhone: "(973) 280-9190",
            whatsappNumber: "19732809190",
            status: BranchStatus.ACTIVE,
            updatedAt: new Date(),
          },
        });
        njBranch = {
          id: newBranch.id,
          name: newBranch.name,
          slug: newBranch.slug,
        };
      }
    }

    // Check if cleaner already exists
    const existingCleaner = await prisma.user.findUnique({
      where: { email: "cleaner.nj@velocitymaid.com" },
    });

    let cleaner;
    if (existingCleaner) {
      // Update to ensure it's active and linked to NJ
      cleaner = await prisma.user.update({
        where: { id: existingCleaner.id },
        data: {
          isActive: true,
          primaryBranchId: njBranch.id,
          role: UserRole.CLEANER,
          updatedAt: new Date(),
        },
      });

      // Ensure UserBranch link exists
      await prisma.userBranch.upsert({
        where: {
          userId_branchId: {
            userId: cleaner.id,
            branchId: njBranch.id,
          },
        },
        create: {
          id: `ub-${cleaner.id}-${njBranch.id}`,
          userId: cleaner.id,
          branchId: njBranch.id,
        },
        update: {},
      });
    } else {
      // Create new cleaner
      const cleanerId = `cleaner-nj-${Date.now()}`;
      cleaner = await prisma.user.create({
        data: {
          id: cleanerId,
          email: "cleaner.nj@velocitymaid.com",
          name: "John Cleaner",
          role: UserRole.CLEANER,
          primaryBranchId: njBranch.id,
          isActive: true,
          isSuspended: false,
          warningCount: 0,
          updatedAt: new Date(),
        },
      });

      // Create UserBranch link
      await prisma.userBranch.create({
        data: {
          id: `ub-${cleaner.id}-${njBranch.id}`,
          userId: cleaner.id,
          branchId: njBranch.id,
        },
      });
    }

    // Verify the cleaner
    const verified = await prisma.user.findUnique({
      where: { id: cleaner.id },
      include: {
        UserBranch: {
          where: { branchId: njBranch.id },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: existingCleaner ? "Cleaner updated" : "Cleaner created",
      cleaner: {
        id: verified?.id,
        email: verified?.email,
        name: verified?.name,
        role: verified?.role,
        isActive: verified?.isActive,
        primaryBranchId: verified?.primaryBranchId,
        branchName: njBranch.name,
        userBranchLinks: verified?.UserBranch.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Error seeding cleaner:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to seed cleaner",
        details: error?.meta,
      },
      { status: 500 }
    );
  }
}

