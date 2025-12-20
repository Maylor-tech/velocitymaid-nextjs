/**
 * Seed Active Cleaner for New Jersey Branch
 * 
 * Creates an ACTIVE cleaner linked to New Jersey branch
 * Run with: npx tsx scripts/seed-cleaner.ts
 */

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

async function seedCleaner() {
  try {
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
        console.log("⚠️  New Jersey branch not found. Creating it...");
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
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        });
        njBranch = {
          id: newBranch.id,
          name: newBranch.name,
          slug: newBranch.slug,
        };
        console.log(`✅ Created branch: ${njBranch.name} (${njBranch.id})`);
      }
    }

    console.log(`✅ Found branch: ${njBranch.name} (${njBranch.id})`);

    // Check if cleaner already exists
    const existingCleaner = await prisma.user.findUnique({
      where: { email: "cleaner.nj@velocitymaid.com" },
    });

    if (existingCleaner) {
      console.log("⚠️  Cleaner already exists. Updating...");
      
      // Update to ensure it's active and linked to NJ
      const updated = await prisma.user.update({
        where: { id: existingCleaner.id },
        data: {
          isActive: true,
          primaryBranchId: njBranch.id,
          role: UserRole.CLEANER,
        },
      });

      // Ensure UserBranch link exists
      await prisma.userBranch.upsert({
        where: {
          userId_branchId: {
            userId: updated.id,
            branchId: njBranch.id,
          },
        },
        create: {
          id: `ub-${updated.id}-${njBranch.id}`,
          userId: updated.id,
          branchId: njBranch.id,
        },
        update: {},
      });

      console.log(`✅ Updated cleaner: ${updated.name || updated.email}`);
      console.log(`   ID: ${updated.id}`);
      console.log(`   Active: ${updated.isActive}`);
      console.log(`   Primary Branch: ${njBranch.name}`);
      return;
    }

    // Create new cleaner
    const cleanerId = `cleaner-nj-${Date.now()}`;
    const cleaner = await prisma.user.create({
      data: {
        id: cleanerId,
        email: "cleaner.nj@velocitymaid.com",
        name: "John Cleaner",
        role: UserRole.CLEANER,
        primaryBranchId: njBranch.id,
        isActive: true,
        isSuspended: false,
        warningCount: 0,
      },
    });

    console.log(`✅ Created cleaner: ${cleaner.name || cleaner.email}`);
    console.log(`   ID: ${cleaner.id}`);

    // Create UserBranch link
    await prisma.userBranch.create({
      data: {
        id: `ub-${cleaner.id}-${njBranch.id}`,
        userId: cleaner.id,
        branchId: njBranch.id,
      },
    });

    console.log(`✅ Linked cleaner to ${njBranch.name} branch`);

    // Verify the cleaner
    const verified = await prisma.user.findUnique({
      where: { id: cleaner.id },
      include: {
        UserBranch: {
          where: { branchId: njBranch.id },
        },
      },
    });

    console.log("\n📋 Verification:");
    console.log(`   Email: ${verified?.email}`);
    console.log(`   Name: ${verified?.name}`);
    console.log(`   Role: ${verified?.role}`);
    console.log(`   Active: ${verified?.isActive}`);
    console.log(`   Primary Branch ID: ${verified?.primaryBranchId}`);
    console.log(`   UserBranch Links: ${verified?.UserBranch.length || 0}`);

    if (verified?.isActive && verified?.primaryBranchId === njBranch.id) {
      console.log("\n✅ Cleaner seeded successfully!");
    } else {
      console.log("\n⚠️  Warning: Cleaner may not be properly configured");
    }
  } catch (error: any) {
    console.error("❌ Error seeding cleaner:", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCleaner();

