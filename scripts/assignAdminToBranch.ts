/**
 * @deprecated Use scripts/setup-admin.ts (creates user + branch assignment)
 *
 * npx dotenv-cli -e .env.local -- npx tsx scripts/setup-admin.ts
 */
import { prisma } from '../lib/prisma';

async function main() {
  const branchSlug = process.env.ADMIN_BRANCH_SLUG?.trim() || 'new-jersey';
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail) {
    console.error('FAIL: Set ADMIN_EMAIL in .env.local');
    process.exit(1);
  }

  const branch = await prisma.branch.findUnique({
    where: { slug: branchSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!branch) {
    throw new Error(`Branch with slug "${branchSlug}" not found.`);
  }

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    throw new Error(`User not found: ${adminEmail}. Run setup-admin.ts first.`);
  }

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

  console.log(`✅ ${adminEmail} assigned to ${branch.name} (${branch.slug})`);
}

main()
  .catch((e) => {
    console.error('❌', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
