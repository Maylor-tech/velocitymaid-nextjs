/**
 * Quick script to create Miami branch for pilot testing
 * 
 * Usage: npx tsx scripts/create-miami-branch.ts
 */

import { prisma } from "../lib/prisma";

const MIAMI_ZIP_CODES = [
  "33101", "33125", "33126", "33127", "33130", "33131", "33132", 
  "33133", "33134", "33135", "33136", "33137", "33138", "33139", "33140"
];

async function createMiamiBranch() {
  try {
    console.log("Creating Miami branch...");

    // Check if Miami branch already exists
    const existing = await prisma.branch.findUnique({
      where: { slug: "miami" },
    });

    if (existing) {
      console.log("✅ Miami branch already exists!");
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Status: ${existing.status}`);
      return existing.id;
    }

    // Create Miami branch
    const branch = await prisma.branch.create({
      data: {
        name: "Miami",
        slug: "miami",
        country: "US",
        state: "FL",
        city: "Miami",
        timezone: "America/New_York",
        primaryPhone: "+1-305-XXX-XXXX",
        whatsappNumber: "+1-305-XXX-XXXX",
        status: "ACTIVE",
        currency: "USD",
      },
    });

    console.log("✅ Miami branch created!");
    console.log(`   ID: ${branch.id}`);
    console.log(`   Slug: ${branch.slug}`);

    // Create branch config
    await prisma.branchConfig.create({
      data: {
        branchId: branch.id,
        maxDailyJobs: 20,
      },
    });

    console.log("✅ Branch config created (maxDailyJobs: 20)");

    // Create service areas for ZIP codes
    const zipCodeData = MIAMI_ZIP_CODES.map((zip) => ({
      branchId: branch.id,
      zipCode: zip,
      priority: 1,
      city: "Miami",
      state: "FL",
    }));

    await prisma.branchServiceArea.createMany({
      data: zipCodeData,
      skipDuplicates: true,
    });

    console.log(`✅ Added ${MIAMI_ZIP_CODES.length} ZIP codes to service area`);

    console.log("\n🎉 Miami branch setup complete!");
    console.log(`\nYou can now test the payout endpoint:`);
    console.log(`  POST http://localhost:3000/api/pilot/payouts/schedule?bypassAuth=true`);
    console.log(`  Body: { "dryRun": true }`);

    return branch.id;
  } catch (error: any) {
    console.error("❌ Error creating Miami branch:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createMiamiBranch()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { createMiamiBranch };


