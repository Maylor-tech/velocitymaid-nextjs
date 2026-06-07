/**
 * Create or update an admin user and assign branch access.
 *
 * Required in .env.local:
 *   ADMIN_EMAIL=you@example.com
 *
 * Optional:
 *   ADMIN_NAME=Your Name
 *   ADMIN_BRANCH_SLUG=new-jersey
 *
 * Run:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/setup-admin.ts
 */
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const branchSlug = process.env.ADMIN_BRANCH_SLUG?.trim() || "new-jersey";

  if (!email) {
    console.error("FAIL: Set ADMIN_EMAIL in .env.local before running this script.");
    process.exit(1);
  }

  const branch = await prisma.branch.findUnique({
    where: { slug: branchSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!branch) {
    console.error(`FAIL: Branch "${branchSlug}" not found. Seed branches first.`);
    process.exit(1);
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    user = await prisma.user.update({
      where: { email },
      data: {
        role: UserRole.ADMIN,
        name,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`Updated existing user → ADMIN: ${email}`);
  } else {
    user = await prisma.user.create({
      data: {
        id: `admin-${Date.now()}`,
        email,
        name,
        role: UserRole.ADMIN,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log(`Created admin user: ${email}`);
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

  console.log(`Assigned branch: ${branch.name} (${branch.slug})`);
  console.log(`Login at /admin/login with: ${email}`);
}

main()
  .catch((err) => {
    console.error("FAIL:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
