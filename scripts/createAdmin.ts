/**
 * @deprecated Use scripts/setup-admin.ts with ADMIN_EMAIL in .env.local
 *
 * npx dotenv-cli -e .env.local -- npx tsx scripts/setup-admin.ts
 */
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || 'Admin';

  if (!email) {
    console.error('FAIL: Set ADMIN_EMAIL in .env.local');
    console.error('Prefer: npx dotenv-cli -e .env.local -- npx tsx scripts/setup-admin.ts');
    process.exit(1);
  }

  console.log('🔍 Checking for existing user...');

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: UserRole.ADMIN,
        name,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    console.log('✅ Admin access confirmed for:', email);
    return;
  }

  await prisma.user.create({
    data: {
      id: `admin-${Date.now()}`,
      email,
      name,
      role: UserRole.ADMIN,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log('🚀 Admin user created:', email);
  console.log('Next: npx dotenv-cli -e .env.local -- npx tsx scripts/setup-admin.ts');
}

main()
  .catch((e) => {
    console.error('❌ Failed to create admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
