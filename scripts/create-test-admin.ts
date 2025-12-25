/**
 * Create a test admin user for development/testing
 */

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

async function createTestAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        email: "admin@test.com",
      },
    });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${existingAdmin.id}`);
      console.log(`   Email: ${existingAdmin.email}`);
      return existingAdmin;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        id: `admin-test-${Date.now()}`,
        email: "admin@test.com",
        name: "Test Admin",
        role: UserRole.ADMIN,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Created admin user: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    return admin;
  } catch (error: any) {
    console.error("❌ Error creating admin:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTestAdmin()
    .then(() => {
      console.log("\n✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Failed:", error);
      process.exit(1);
    });
}

export { createTestAdmin };














