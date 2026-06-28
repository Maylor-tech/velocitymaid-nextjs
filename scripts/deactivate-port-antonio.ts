/**
 * Set Port Antonio branch to PAUSED (inactive).
 *
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/deactivate-port-antonio.ts
 */
import { prisma } from '../lib/prisma';
import { BranchStatus } from '@prisma/client';

async function main() {
  const branch = await prisma.branch.findUnique({
    where: { slug: 'port-antonio' },
    select: { id: true, name: true, slug: true, status: true },
  });

  if (!branch) {
    console.error('FAIL: Port Antonio branch (slug: port-antonio) not found.');
    process.exit(1);
  }

  console.log('Before:', branch);

  const updated = await prisma.branch.update({
    where: { slug: 'port-antonio' },
    data: { status: BranchStatus.PAUSED, updatedAt: new Date() },
    select: { id: true, name: true, slug: true, status: true },
  });

  console.log('After:', updated);
  console.log('Port Antonio is now PAUSED (inactive).');
}

main()
  .catch((err) => {
    console.error('FAIL:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
