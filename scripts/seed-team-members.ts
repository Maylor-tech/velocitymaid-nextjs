/**
 * Seed internal VelocityMaid team members (Brian & Caryll).
 * Usage: npx tsx scripts/seed-team-members.ts
 */

import { prisma } from '../lib/prisma';
import { createInternalCleaner } from '../lib/cleaners/internalCleanerService';

async function main() {
  const vermont = await prisma.branch.findFirst({
    where: { slug: 'vermont' },
    select: { id: true, name: true },
  });

  if (!vermont) {
    console.error('Vermont branch not found — run branch seed first.');
    process.exit(1);
  }

  const members = [
    {
      firstName: 'Brian',
      lastName: 'Bruce Maylor',
      email: 'brian@velocitymaid.com',
      phone: '',
      publicDisplayName: 'Brian Maylor',
      jobTitle: 'Founder & Certified Cleaning Professional',
      certificationLabel: 'Certified / Internal',
      internalNotes: 'Founder-led service team — Vermont',
    },
    {
      firstName: 'Caryll',
      lastName: 'Dagupen',
      email: 'caryll@velocitymaid.com',
      phone: '',
      publicDisplayName: 'Caryll Dagupen',
      jobTitle: 'Guest Experience Coordinator & Cleaning Professional',
      certificationLabel: 'Certified / Internal',
      internalNotes: 'Founder-led service team — Vermont',
    },
  ];

  for (const m of members) {
    const result = await createInternalCleaner({
      ...m,
      branchId: vermont.id,
      serviceAreas: ['Middlebury', 'Vermont'],
      memberStatus: 'ACTIVE',
      isInternalTeam: true,
      trainingPassed: true,
    });
    console.log(`✓ ${m.publicDisplayName} (${result.userId})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
