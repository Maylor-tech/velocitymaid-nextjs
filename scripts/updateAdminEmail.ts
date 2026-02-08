import { prisma } from '../lib/prisma';

const OLD_EMAIL = 'laura.berlenbach@gmail.com';
const NEW_EMAIL = 'berlenbacklaura@icloud.com';

async function main() {
  console.log('🔍 Updating admin email...');

  const user = await prisma.user.findUnique({
    where: { email: OLD_EMAIL },
  });

  if (!user) {
    throw new Error(`User not found: ${OLD_EMAIL}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: NEW_EMAIL,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Email updated successfully');
  console.log(`Old: ${OLD_EMAIL}`);
  console.log(`New: ${NEW_EMAIL}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
