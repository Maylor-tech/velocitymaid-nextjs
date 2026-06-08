/**
 * Read-only admin login diagnostics — no secrets printed.
 * npx dotenv-cli -e .env.local -- npx tsx scripts/check-admin-status.ts [email]
 */
import { prisma } from "../lib/prisma";

const email = (process.argv[2] || process.env.ADMIN_EMAIL || "admin@velocitymaid.com")
  .trim()
  .toLowerCase();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, isActive: true },
  });

  if (!user) {
    console.log(`USER_EXISTS: false (${email})`);
  } else {
    const branchCount = await prisma.userBranch.count({
      where: { userId: user.id },
    });
    console.log(`USER_EXISTS: true (${email})`);
    console.log(`ROLE: ${user.role}`);
    console.log(`IS_ACTIVE: ${user.isActive}`);
    console.log(`BRANCH_ASSIGNMENTS: ${branchCount}`);
  }

  const nj = await prisma.branch.findUnique({
    where: { slug: "new-jersey" },
    select: { slug: true, name: true },
  });
  console.log(`NJ_BRANCH_EXISTS: ${Boolean(nj)}`);
  if (nj) console.log(`NJ_BRANCH: ${nj.name}`);
}

main()
  .catch((err) => {
    console.error("FAIL:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
