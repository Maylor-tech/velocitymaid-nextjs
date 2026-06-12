/**
 * Seed Active Cleaner for New Jersey Branch
 *
 * Creates an ACTIVE cleaner linked to New Jersey branch with an APPROVED application.
 *
 * Run with:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/seed-cleaner.ts
 *
 * Optional env:
 *   E2E_CLEANER_EMAIL  (default: cleaner.nj@velocitymaid.com)
 *   E2E_CLEANER_NAME   (default: John Cleaner (Test))
 */

import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { CleanerApplicationStatus, UserRole } from '@prisma/client';

const CLEANER_EMAIL =
  process.env.E2E_CLEANER_EMAIL?.trim().toLowerCase() ||
  'cleaner.nj@velocitymaid.com';
const CLEANER_NAME = process.env.E2E_CLEANER_NAME?.trim() || 'John Cleaner (Test)';

async function ensureApprovedApplication(cleanerId: string, branchId: string, email: string) {
  const existing = await prisma.cleanerApplication.findFirst({
    where: { email, branchId },
  });

  if (existing) {
    if (existing.status !== CleanerApplicationStatus.APPROVED) {
      await prisma.cleanerApplication.update({
        where: { id: existing.id },
        data: {
          status: CleanerApplicationStatus.APPROVED,
          updatedAt: new Date(),
        },
      });
    }
    return existing.id;
  }

  const application = await prisma.cleanerApplication.create({
    data: {
      id: randomUUID(),
      name: CLEANER_NAME,
      email,
      phone: '+19735556677',
      branchId,
      status: CleanerApplicationStatus.APPROVED,
      updatedAt: new Date(),
    },
  });

  return application.id;
}

async function seedCleaner() {
  try {
    let njBranch = await prisma.branch.findUnique({
      where: { slug: 'new-jersey' },
      select: { id: true, name: true, slug: true },
    });

    if (!njBranch) {
      njBranch = await prisma.branch.findFirst({
        where: {
          OR: [
            { name: { contains: 'Jersey', mode: 'insensitive' } },
            { slug: { contains: 'jersey', mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true },
      });

      if (!njBranch) {
        console.log('⚠️  New Jersey branch not found. Creating it...');
        const newBranch = await prisma.branch.create({
          data: {
            id: `branch-nj-${Date.now()}`,
            name: 'New Jersey',
            slug: 'new-jersey',
            country: 'US',
            state: 'New Jersey',
            city: 'Newark',
            regionLabel: 'New Jersey',
            timezone: 'America/New_York',
            primaryPhone: '(973) 280-9190',
            whatsappNumber: '19732809190',
            status: 'ACTIVE',
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

    const existingCleaner = await prisma.user.findUnique({
      where: { email: CLEANER_EMAIL },
    });

    let cleanerId: string;

    if (existingCleaner) {
      console.log('⚠️  Cleaner already exists. Updating...');
      const updated = await prisma.user.update({
        where: { id: existingCleaner.id },
        data: {
          isActive: true,
          primaryBranchId: njBranch.id,
          role: UserRole.CLEANER,
          name: CLEANER_NAME,
          updatedAt: new Date(),
        },
      });
      cleanerId = updated.id;
    } else {
      cleanerId = `cleaner-nj-${Date.now()}`;
      await prisma.user.create({
        data: {
          id: cleanerId,
          email: CLEANER_EMAIL,
          name: CLEANER_NAME,
          role: UserRole.CLEANER,
          primaryBranchId: njBranch.id,
          isActive: true,
          isSuspended: false,
          warningCount: 0,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created cleaner: ${CLEANER_NAME}`);
    }

    await prisma.userBranch.upsert({
      where: {
        userId_branchId: {
          userId: cleanerId,
          branchId: njBranch.id,
        },
      },
      create: {
        id: `ub-${cleanerId}-${njBranch.id}`,
        userId: cleanerId,
        branchId: njBranch.id,
      },
      update: {},
    });

    const applicationId = await ensureApprovedApplication(
      cleanerId,
      njBranch.id,
      CLEANER_EMAIL
    );

    const verified = await prisma.user.findUnique({
      where: { id: cleanerId },
      include: {
        UserBranch: { where: { branchId: njBranch.id } },
      },
    });

    console.log('\n📋 Verification:');
    console.log(`   Email: ${verified?.email}`);
    console.log(`   ID: ${verified?.id}`);
    console.log(`   Name: ${verified?.name}`);
    console.log(`   Active: ${verified?.isActive}`);
    console.log(`   Primary Branch ID: ${verified?.primaryBranchId}`);
    console.log(`   Application ID: ${applicationId} (APPROVED)`);
    console.log(`   UserBranch Links: ${verified?.UserBranch.length || 0}`);
    console.log('\n🔐 Cleaner login (local dev):');
    console.log(`   Visit /cleaners/login and enter email: ${CLEANER_EMAIL}`);

    if (verified?.isActive && verified?.primaryBranchId === njBranch.id) {
      console.log('\n✅ Cleaner seeded successfully!');
    } else {
      console.log('\n⚠️  Warning: Cleaner may not be properly configured');
    }
  } catch (error: unknown) {
    console.error('❌ Error seeding cleaner:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCleaner();
