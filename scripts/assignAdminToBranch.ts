/**
 * Assign an admin user to a branch (e.g. Laura → NJ).
 * Creates/updates UserBranch so the admin has access to that branch.
 *
 * Usage: npx tsx scripts/assignAdminToBranch.ts
 */

import { prisma } from '../lib/prisma';

const NJ_BRANCH_SLUG = 'new-jersey';
const ADMIN_EMAIL = 'laura@velocitymaid.com';

async function main() {
  const branch = await prisma.branch.findUnique({
    where: { slug: NJ_BRANCH_SLUG },
    select: { id: true, name: true, slug: true },
  });

  if (!branch) {
    throw new Error(`Branch with slug "${NJ_BRANCH_SLUG}" not found. Run seed-nj-branch-operator first.`);
  }

  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!user) {
    throw new Error(`User not found: ${ADMIN_EMAIL}`);
  }

  const branchId = branch.id;

  await prisma.userBranch.upsert({
    where: {
      userId_branchId: {
        userId: user.id,
        branchId,
      },
    },
    update: {},
    create: {
      id: `ub-laura-nj-${Date.now()}`,
      userId: user.id,
      branchId,
    },
  });

  console.log(`✅ Laura assigned to NJ branch (${branch.name} / ${branch.slug})`);
}

main()
  .catch((e) => {
    console.error('❌', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
