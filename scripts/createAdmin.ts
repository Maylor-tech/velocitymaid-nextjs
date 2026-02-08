import { prisma } from '../lib/prisma';

async function main() {
  const email = 'laura@velocitymaid.com'; // <-- change if needed
  const name = 'Laura';
  const role = 'ADMIN'; // ADMIN | BRANCH_MANAGER

  console.log('🔍 Checking for existing user...');

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('✅ User already exists. Updating role if needed.');

    await prisma.user.update({
      where: { email },
      data: {
        role,
        name,
        updatedAt: new Date(),
      },
    });

    console.log('🎯 Admin access confirmed for:', email);
    return;
  }

  console.log('➕ Creating new admin user...');

  await prisma.user.create({
    data: {
      id: `admin-${Date.now()}`,
      email,
      name,
      role,
      updatedAt: new Date(),
    },
  });

  console.log('🚀 Admin user created successfully!');
  console.log('📧 Email:', email);
  console.log('🛡️ Role:', role);
}

main()
  .catch((e) => {
    console.error('❌ Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
