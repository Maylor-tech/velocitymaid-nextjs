/**
 * Script to add Port Antonio branch to database
 * Run with: npx tsx scripts/add-port-antonio.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPortAntonio() {
  try {
    console.log('🌴 Adding Port Antonio branch to database...');

    // Check if branch already exists
    const existing = await prisma.branch.findUnique({
      where: { slug: 'port-antonio' },
    });

    if (existing) {
      console.log('✅ Port Antonio branch already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Status: ${existing.status}`);
      
      // Check if service packages exist
      const packages = await prisma.branchServicePackage.findMany({
        where: { branchId: existing.id },
      });
      
      if (packages.length === 0) {
        console.log('⚠️  No service packages found. Adding default packages...');
        await addServicePackages(existing.id);
      } else {
        console.log(`✅ Found ${packages.length} service packages`);
      }
      
      // Check if landing content exists
      const landingContent = await prisma.branchLandingContent.findUnique({
        where: { branchId: existing.id },
      });
      
      if (!landingContent) {
        console.log('⚠️  No landing content found. Adding landing content...');
        await addLandingContent(existing.id);
      } else {
        console.log('✅ Landing content already exists');
      }
      
      return;
    }

    // Create branch with all related data in a transaction
    const branch = await prisma.$transaction(async (tx) => {
      // Create branch
      const newBranch = await tx.branch.create({
        data: {
          name: 'Port Antonio',
          slug: 'port-antonio',
          city: 'Port Antonio',
          state: 'Portland',
          country: 'Jamaica',
          regionLabel: 'Jamaica',
          timezone: 'America/Jamaica',
          primaryPhone: '+1 (876) 555-1985',
          whatsappNumber: '+1 (876) 555-1985',
          status: 'COMING_SOON',
        },
      });

      console.log(`✅ Created branch: ${newBranch.id}`);

      // Create branch config
      await tx.branchConfig.create({
        data: {
          branchId: newBranch.id,
        },
      });

      // Create automation config
      await tx.branchAutomationConfig.create({
        data: {
          branchId: newBranch.id,
        },
      });

      // Add service packages
      await addServicePackages(newBranch.id, tx);

      // Add landing content
      await addLandingContent(newBranch.id, tx);

      return newBranch;
    });

    console.log('🎉 Port Antonio branch added successfully!');
    console.log(`   Branch ID: ${branch.id}`);
    console.log(`   Slug: ${branch.slug}`);
    console.log(`   Status: ${branch.status}`);
  } catch (error: any) {
    console.error('❌ Error adding Port Antonio branch:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function addServicePackages(
  branchId: string,
  tx?: any
) {
  const prismaClient = tx || prisma;

  const packages = [
    {
      branchId,
      code: 'STANDARD_CLEAN',
      name: 'Standard Clean',
      description: 'Thorough cleaning of all rooms, including dusting, vacuuming, mopping, and bathroom cleaning.',
      defaultDurationHours: 2,
      basePrice: 80,
      isActive: true,
    },
    {
      branchId,
      code: 'DEEP_CLEAN',
      name: 'Deep Clean',
      description: 'Comprehensive deep cleaning including inside appliances, baseboards, windows, and detailed scrubbing.',
      defaultDurationHours: 4,
      basePrice: 150,
      isActive: true,
    },
    {
      branchId,
      code: 'MOVE_IN_OUT',
      name: 'Move In/Out Clean',
      description: 'Complete cleaning for move-in or move-out situations, including all areas and appliances.',
      defaultDurationHours: 6,
      basePrice: 250,
      isActive: true,
    },
  ];

  for (const pkg of packages) {
    await prismaClient.branchServicePackage.upsert({
      where: {
        branchId_code: {
          branchId: pkg.branchId,
          code: pkg.code,
        },
      },
      create: pkg,
      update: pkg,
    });
  }

  console.log(`✅ Added ${packages.length} service packages`);
}

async function addLandingContent(
  branchId: string,
  tx?: any
) {
  const prismaClient = tx || prisma;

  await prismaClient.branchLandingContent.upsert({
    where: { branchId },
    create: {
      branchId,
      headline: 'Professional Cleaning Services in Port Antonio, Jamaica',
      subheadline: 'Experience the VelocityMaid difference in Port Antonio. Trusted, reliable, and thorough cleaning services for your home or business.',
      seoTitle: 'Professional Cleaning Services in Port Antonio, Jamaica | VelocityMaid',
      seoDescription: 'Book professional cleaning services in Port Antonio, Jamaica. Fast, reliable, and affordable. Get your free quote today!',
      localCtaLabel: 'Apply to Join Our Team',
    },
    update: {
      headline: 'Professional Cleaning Services in Port Antonio, Jamaica',
      subheadline: 'Experience the VelocityMaid difference in Port Antonio. Trusted, reliable, and thorough cleaning services for your home or business.',
      seoTitle: 'Professional Cleaning Services in Port Antonio, Jamaica | VelocityMaid',
      seoDescription: 'Book professional cleaning services in Port Antonio, Jamaica. Fast, reliable, and affordable. Get your free quote today!',
      localCtaLabel: 'Apply to Join Our Team',
    },
  });

  console.log('✅ Added landing content');
}

// Run the script
addPortAntonio()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });


