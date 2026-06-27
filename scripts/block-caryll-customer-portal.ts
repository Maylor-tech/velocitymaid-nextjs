/**
 * Block internal team members from customer portal guest access.
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/block-caryll-customer-portal.ts
 */
import { prisma } from '../lib/prisma';
import { isCustomerPortalEmailBlocked } from '../lib/customer/portalAccess';

async function main() {
  const candidates = await prisma.customer.findMany({
    where: {
      OR: [
        { email: { contains: 'caryll', mode: 'insensitive' } },
        { firstName: { contains: 'Caryll', mode: 'insensitive' } },
        { lastName: { contains: 'Dagupen', mode: 'insensitive' } },
      ],
    },
    select: { id: true, email: true, firstName: true, lastName: true, isBlocked: true },
  });

  if (candidates.length === 0) {
    console.log('No Caryll customer records found.');
    return;
  }

  for (const c of candidates) {
    const shouldBlock =
      isCustomerPortalEmailBlocked(c.email) ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes('caryll');

    if (!shouldBlock) {
      console.log(`Skip (not portal-blocked): ${c.email}`);
      continue;
    }

    await prisma.customer.update({
      where: { id: c.id },
      data: { isBlocked: true, updatedAt: new Date() },
    });
    console.log(`Blocked customer portal access: ${c.email} (${c.id})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
