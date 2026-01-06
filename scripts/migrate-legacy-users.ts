/**
 * Migration script to assign legacy users (without tenantId) to a default tenant
 * 
 * Usage:
 *   npx tsx scripts/migrate-legacy-users.ts
 * 
 * This will:
 * 1. Find all users without a tenantId
 * 2. Create a default tenant for them (or use existing)
 * 3. Assign them to that tenant
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateLegacyUsers() {
  console.log('Starting legacy user migration...');

  try {
    // Find all users without tenantId
    const usersWithoutTenant = await prisma.user.findMany({
      where: {
        tenantId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`Found ${usersWithoutTenant.length} users without tenantId`);

    if (usersWithoutTenant.length === 0) {
      console.log('No users to migrate. Exiting.');
      return;
    }

    // Find or create a default tenant
    let defaultTenant = await prisma.tenant.findFirst({
      where: {
        name: 'Legacy Users',
      },
    });

    if (!defaultTenant) {
      console.log('Creating default tenant for legacy users...');
      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'Legacy Users',
        },
      });
      console.log(`Created tenant: ${defaultTenant.id}`);
    } else {
      console.log(`Using existing tenant: ${defaultTenant.id}`);
    }

    // Update users to assign them to the default tenant
    console.log('Assigning users to tenant...');
    const updateResult = await prisma.user.updateMany({
      where: {
        tenantId: null,
      },
      data: {
        tenantId: defaultTenant.id,
      },
    });

    console.log(`✅ Successfully migrated ${updateResult.count} users to tenant ${defaultTenant.id}`);
    console.log('\nMigrated users:');
    usersWithoutTenant.forEach((user) => {
      console.log(`  - ${user.email} (${user.name || 'No name'})`);
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateLegacyUsers()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

