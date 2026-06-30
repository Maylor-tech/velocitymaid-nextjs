/**
 * Set Vermont travel zones for known property customers.
 *
 * Run:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/seed-travel-zones.ts
 */
import { TravelZone } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface ZoneTarget {
  label: string;
  travelZone: TravelZone;
  match: (c: {
    firstName: string;
    lastName: string;
    defaultAddress: string | null;
    addressLine1: string | null;
    city: string | null;
  }) => boolean;
}

const TARGETS: ZoneTarget[] = [
  {
    label: 'Chris Ray Hautchamp — 198 Chipman Park',
    travelZone: TravelZone.ZONE_C,
    match: (c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes('hautchamp') ||
      [c.defaultAddress, c.addressLine1].some((a) =>
        (a || '').toLowerCase().includes('chipman park')
      ),
  },
  {
    label: 'Tiffany Pimpinella — 172 Bear Hill Road, Ludlow',
    travelZone: TravelZone.ZONE_A,
    match: (c) =>
      c.firstName.toLowerCase().includes('tiffany') &&
      c.lastName.toLowerCase().includes('pimpinella') ||
      [c.defaultAddress, c.addressLine1].some((a) =>
        (a || '').toLowerCase().includes('bear hill')
      ),
  },
  {
    label: 'Jeff Lajoie — 354 Grout Road, Perkinsville',
    travelZone: TravelZone.ZONE_B,
    match: (c) =>
      c.firstName.toLowerCase().includes('jeff') &&
      c.lastName.toLowerCase().includes('lajoie') ||
      [c.defaultAddress, c.addressLine1].some((a) =>
        (a || '').toLowerCase().includes('grout road')
      ),
  },
];

async function main() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      defaultAddress: true,
      addressLine1: true,
      city: true,
      travelZone: true,
    },
  });

  for (const target of TARGETS) {
    const match = customers.find(target.match);
    if (!match) {
      console.warn(`⚠ No customer found for: ${target.label}`);
      continue;
    }

    if (match.travelZone === target.travelZone) {
      console.log(`✓ ${target.label} already ${target.travelZone} (${match.email})`);
      continue;
    }

    await prisma.customer.update({
      where: { id: match.id },
      data: { travelZone: target.travelZone, updatedAt: new Date() },
    });
    console.log(`✓ ${target.label} → ${target.travelZone} (${match.email})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
