/**
 * Create or update admin user
 * 
 * Usage:
 *   npx tsx scripts/createAdmin.ts
 * 
 * Alternative (if tsx not available):
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/createAdmin.ts
 */

import { prisma } from "../lib/prisma";

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "maylortech007@gmail.com" },
    update: {
      role: "ADMIN",
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      id: `admin-${Date.now()}`,
      email: "maylortech007@gmail.com",
      name: "Brian Maylor",
      role: "ADMIN",
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Admin user ensured");
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${admin.name}`);
  console.log(`   Role: ${admin.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

