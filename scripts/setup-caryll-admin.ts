/**
 * Create Caryll Dagupen as a Vermont-scoped admin.
 *
 * Run:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/setup-caryll-admin.ts
 *
 * Then set the printed password in Vercel as CARYLL_ADMIN_PASSWORD.
 */
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

const CARYLL_EMAIL = 'caryll@velocitymaid.com';
const CARYLL_NAME = 'Caryll Dagupen';
const VERMONT_SLUG = 'vermont';

function generateTempPassword(): string {
  const segment = crypto.randomBytes(4).toString('hex');
  return `VmVt-${segment}!`;
}

async function main() {
  const branch = await prisma.branch.findUnique({
    where: { slug: VERMONT_SLUG },
    select: { id: true, name: true },
  });

  if (!branch) {
    console.error(`FAIL: Branch "${VERMONT_SLUG}" not found. Seed branches first.`);
    process.exit(1);
  }

  const tempPassword = generateTempPassword();

  let user = await prisma.user.findUnique({ where: { email: CARYLL_EMAIL } });

  if (user) {
    user = await prisma.user.update({
      where: { email: CARYLL_EMAIL },
      data: {
        role: UserRole.ADMIN,
        name: CARYLL_NAME,
        isActive: true,
        primaryBranchId: branch.id,
        updatedAt: new Date(),
      },
    });
    console.log(`Updated existing user → ADMIN: ${CARYLL_EMAIL}`);
  } else {
    user = await prisma.user.create({
      data: {
        id: `admin-caryll-${Date.now()}`,
        email: CARYLL_EMAIL,
        name: CARYLL_NAME,
        role: UserRole.ADMIN,
        isActive: true,
        primaryBranchId: branch.id,
        updatedAt: new Date(),
      },
    });
    console.log(`Created admin user: ${CARYLL_EMAIL}`);
  }

  // Remove any non-Vermont branch assignments
  await prisma.userBranch.deleteMany({
    where: {
      userId: user.id,
      branchId: { not: branch.id },
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
      id: `ub-${user.id}-${branch.id}`,
      userId: user.id,
      branchId: branch.id,
    },
  });

  console.log('');
  console.log('=== Caryll admin access ===');
  console.log(`Email:    ${CARYLL_EMAIL}`);
  console.log(`Branch:   ${branch.name}`);
  console.log(`Login:    https://velocitymaid.com/admin/login`);
  console.log('');
  console.log('Temporary password (set as CARYLL_ADMIN_PASSWORD in Vercel):');
  console.log(`  ${tempPassword}`);
  console.log('');
  console.log('Scope: Vermont jobs only — no billing, cleaners, or NJ pages.');
  console.log('Customer portal remains blocked for this email.');
}

main()
  .catch((err) => {
    console.error('FAIL:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
