/**
 * Set Laura's phone and ensure she's assigned to the NJ branch.
 * Usage: npx tsx scripts/setLauraPhoneAndBranch.ts
 */

import { prisma } from '../lib/prisma';

const LAURA_EMAIL = 'berlenbacklaura@icloud.com';
const LAURA_PHONE = '7327325991'; // E.164 without + for storage; use +1 for US
const NJ_BRANCH_SLUG = 'new-jersey';

async function main() {
  const branch = await prisma.branch.findUnique({
    where: { slug: NJ_BRANCH_SLUG },
    select: { id: true, name: true, slug: true },
  });

  if (!branch) {
    throw new Error(`Branch with slug "${NJ_BRANCH_SLUG}" not found.`);
  }

  const user = await prisma.user.findUnique({
    where: { email: LAURA_EMAIL },
  });

  if (!user) {
    throw new Error(`User not found: ${LAURA_EMAIL}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone: LAURA_PHONE,
      updatedAt: new Date(),
    },
  });

  await prisma.userBranch.upsert({
    where: {
      userId_branchId: {
        userId: user.id,
        branchId: branch.id,
      },
    },
    update: {},
    create: {
      id: `ub-${user.id}-${branch.id}-${Date.now()}`,
      userId: user.id,
      branchId: branch.id,
    },
  });

  console.log('✅ Laura updated:');
  console.log(`   Phone: ${LAURA_PHONE}`);
  console.log(`   NJ branch: ${branch.name} (${branch.slug})`);
}

main()
  .catch((e) => {
    console.error('❌', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
