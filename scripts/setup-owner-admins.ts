/**
 * Create / repair full-access owner admins.
 *
 * An admin assigned to more than one branch is treated as full-access
 * (unscoped) by resolveAdminBranchScope, so they can see and complete jobs
 * across every market (Vermont + New Jersey). This avoids depending on the
 * ADMIN_EMAIL env var being set in production.
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/setup-owner-admins.ts
 */
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";

const OWNER_ADMINS: Array<{ email: string; name: string }> = [
  { email: "brian@velocitymaid.com", name: "Brian" },
  { email: "admin@velocitymaid.com", name: "Admin" },
];

async function ensureAdmin(email: string, name: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });

  if (existing) {
    await prisma.user.update({
      where: { email: normalized },
      data: { role: UserRole.ADMIN, isActive: true, updatedAt: new Date() },
    });
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: normalized,
      name,
      role: UserRole.ADMIN,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  return created.id;
}

async function assignAllBranches(userId: string, branchIds: string[]) {
  for (const branchId of branchIds) {
    await prisma.userBranch.upsert({
      where: { userId_branchId: { userId, branchId } },
      update: {},
      create: {
        id: `ub-${userId}-${branchId}`.slice(0, 60) + `-${Date.now()}`,
        userId,
        branchId,
      },
    });
  }
}

async function main() {
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { slug: "asc" },
  });

  console.log(`BRANCHES (${branches.length}):`);
  for (const b of branches) console.log(`  - ${b.slug} | ${b.name} | ${b.id}`);

  const branchIds = branches.map((b) => b.id);
  if (branchIds.length === 0) {
    throw new Error("No branches found — cannot assign admins.");
  }

  for (const { email, name } of OWNER_ADMINS) {
    const userId = await ensureAdmin(email, name);
    await assignAllBranches(userId, branchIds);
    const count = await prisma.userBranch.count({ where: { userId } });
    console.log(
      `OK: ${email} -> ADMIN, active, branches=${count} (full-access=${count !== 1})`
    );
  }
}

main()
  .catch((e) => {
    console.error("FAIL:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
