/**
 * Seed Active Cleaner for a branch (default: New Jersey)
 *
 * Creates or updates an ACTIVE cleaner with APPROVED application and branch link.
 *
 * Run with:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/seed-cleaner.ts
 *
 * Env (preferred):
 *   TEST_CLEANER_EMAIL   (default: cleaner.nj@velocitymaid.com)
 *   TEST_CLEANER_NAME    (default: John Cleaner (Test))
 *   TEST_BRANCH_SLUG     (default: new-jersey)
 *
 * Legacy aliases still supported: E2E_CLEANER_EMAIL, E2E_CLEANER_NAME
 */

import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { BranchStatus, CleanerApplicationStatus, UserRole } from '@prisma/client';

const CLEANER_EMAIL = (
  process.env.TEST_CLEANER_EMAIL ||
  process.env.E2E_CLEANER_EMAIL ||
  'cleaner.nj@velocitymaid.com'
)
  .trim()
  .toLowerCase();

const CLEANER_NAME =
  process.env.TEST_CLEANER_NAME?.trim() ||
  process.env.E2E_CLEANER_NAME?.trim() ||
  'John Cleaner (Test)';

const BRANCH_SLUG =
  process.env.TEST_BRANCH_SLUG?.trim() ||
  process.env.E2E_BRANCH_SLUG?.trim() ||
  'new-jersey';

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

async function findOrCreateBranch(slug: string) {
  let branch = await prisma.branch.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (branch) return branch;

  branch = await prisma.branch.findFirst({
    where: {
      OR: [
        { slug: { contains: slug.replace('-', ''), mode: 'insensitive' } },
        { name: { contains: slug.replace('-', ' '), mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, slug: true },
  });

  if (branch) return branch;

  console.log(`⚠️  Branch "${slug}" not found. Creating New Jersey branch...`);
  const created = await prisma.branch.create({
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
      status: BranchStatus.ACTIVE,
      updatedAt: new Date(),
    },
  });

  return { id: created.id, name: created.name, slug: created.slug };
}

async function seedCleaner() {
  try {
    const branch = await findOrCreateBranch(BRANCH_SLUG);
    console.log(`✅ Found branch: ${branch.name} (${branch.id})`);

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
          isSuspended: false,
          primaryBranchId: branch.id,
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
          primaryBranchId: branch.id,
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
          branchId: branch.id,
        },
      },
      create: {
        id: `ub-${cleanerId}-${branch.id}`,
        userId: cleanerId,
        branchId: branch.id,
      },
      update: {},
    });

    const applicationId = await ensureApprovedApplication(
      cleanerId,
      branch.id,
      CLEANER_EMAIL
    );

    const verified = await prisma.user.findUnique({
      where: { id: cleanerId },
      include: {
        UserBranch: { where: { branchId: branch.id } },
      },
    });

    console.log('\n📋 Verification:');
    console.log(`   Email: ${verified?.email}`);
    console.log(`   ID: ${verified?.id}`);
    console.log(`   Name: ${verified?.name}`);
    console.log(`   Role: ${verified?.role}`);
    console.log(`   Active: ${verified?.isActive}`);
    console.log(`   Primary Branch ID: ${verified?.primaryBranchId}`);
    console.log(`   Application ID: ${applicationId} (APPROVED)`);
    console.log(`   UserBranch Links: ${verified?.UserBranch.length || 0}`);
    console.log('\n🔐 Cleaner login (local dev):');
    console.log(`   1. Visit http://localhost:3000/cleaners/login`);
    console.log(`   2. Enter email only (no password): ${CLEANER_EMAIL}`);
    console.log(`   3. Job portal: /cleaner/jobs`);

    if (verified?.isActive && verified?.primaryBranchId === branch.id) {
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
